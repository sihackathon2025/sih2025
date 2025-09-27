// lib/sync.js
import NetInfo from '@react-native-community/netinfo';
import { database } from './database';
import api from './api';
import { Q } from '@nozbe/watermelondb';

let isSyncing = false;

// Pushes locally created reports to the server
export const syncPendingReports = async () => {
  if (isSyncing) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  isSyncing = true;
  console.log('Syncing pending reports to server...');

  try {
    const reportsCollection = database.collections.get('reports');
    const pendingReports = await reportsCollection.query(Q.where('status', 'pending')).fetch();

    if (pendingReports.length === 0) {
      console.log('No pending reports to sync.');
      return;
    }

    for (const report of pendingReports) {
        // Exclude internal fields before sending to API
        const reportData = {
            patient_name: report.patient_name, age: report.age, gender: report.gender,
            symptoms: report.symptoms, severity: report.severity, water_source: report.water_source,
            treatment_given: report.treatment_given, state: report.state, district: report.district,
            village: report.village, asha_worker_id: report.asha_worker_id,
            date_of_reporting: report.date_of_reporting,
        };
        
        const response = await api.post('/data_collection/health-reports/', reportData);

        // Mark the local report as 'synced' and store its server-side ID
        await database.write(async () => {
          await report.update(record => {
            record.status = 'synced';
            record.remote_id = response.data.id;
          });
        });
    }
  } catch (error) {
    console.error('Failed to sync pending reports:', error);
  } finally {
    isSyncing = false;
  }
};

// Fetches the latest reports from the server and updates the local DB
export const pullLatestReports = async (user) => {
    if (!user) return;
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    console.log("Pulling latest reports from server...");
    try {
        const response = await api.get('/data_collection/aasha_worker_reports/', {
            params: { asha_worker_id: user.user_id, reportPeriod: 'total' },
        });
        const serverReports = response.data.reports;
        const reportsCollection = database.collections.get('reports');

        await database.write(async () => {
            // A simple but effective sync strategy: find which server reports are missing locally
            const localReports = await reportsCollection.query().fetch();
            const localRemoteIds = new Set(localReports.map(r => r.remote_id));

            const newReportsToCreate = serverReports
                .filter(serverReport => !localRemoteIds.has(serverReport.id))
                .map(report => reportsCollection.prepareCreate(r => {
                    r.remote_id = report.id;
                    r.patient_name = report.patient_name;
                    r.age = report.age;
                    r.gender = report.gender;
                    r.symptoms = report.symptoms;
                    r.severity = report.severity;
                    r.water_source = report.water_source;
                    r.state = report.state || user.state;
                    r.district = report.district || user.district;
                    r.village = report.village || user.village;
                    r.asha_worker_id = report.asha_worker_id || user.user_id;
                    r.date_of_reporting = report.date_of_reporting;
                    r.status = 'synced';
                }));
            
            if (newReportsToCreate.length > 0) {
                await database.batch(...newReportsToCreate);
                console.log(`Synced ${newReportsToCreate.length} new reports from server.`);
            }
        });
    } catch (error) {
        console.error("Could not pull latest reports:", error);
    }
};

// Listens for internet connection changes to trigger sync automatically
export const setupSyncListener = (user) => {
  const onStateChange = (state) => {
    if (state.isConnected) {
      console.log('Connection detected. Triggering sync...');
      syncPendingReports();
      pullLatestReports(user);
    }
  };
  return NetInfo.addEventListener(onStateChange);
};