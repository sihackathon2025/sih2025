// app/LocationSelector.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import addressData from '../lib/address_data.json';

const LocationSelector = ({ state, district, village, onChange }) => {
  const [selectedState, setSelectedState] = useState(state || "");
  const [selectedDistrict, setSelectedDistrict] = useState(district || "");
  const [selectedVillage, setSelectedVillage] = useState(village || "");
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync with parent props when they change
  useEffect(() => {
    if (state !== undefined && state !== selectedState) {
      setSelectedState(state);
    }
  }, [state]);

  useEffect(() => {
    if (district !== undefined && district !== selectedDistrict) {
      setSelectedDistrict(district);
    }
  }, [district]);

  useEffect(() => {
    if (village !== undefined && village !== selectedVillage) {
      setSelectedVillage(village);
    }
  }, [village]);

  // Only notify parent after initial mount to prevent infinite loops
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Skip the first render to prevent calling onChange on initial mount
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    // Only call onChange if there's actually a change and it's a valid function
    if (onChange && typeof onChange === 'function') {
      onChange("state", selectedState);
    }
  }, [selectedState]);

  useEffect(() => {
    if (!isMountedRef.current || !isInitializedRef.current) return;
    
    if (onChange && typeof onChange === 'function') {
      onChange("district", selectedDistrict);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (!isMountedRef.current || !isInitializedRef.current) return;
    
    if (onChange && typeof onChange === 'function') {
      onChange("village", selectedVillage);
    }
  }, [selectedVillage]);

  // SAFEGUARD: Ensure addressData exists and is valid
  if (!addressData || typeof addressData !== 'object') {
    return (
      <View>
        <Text style={styles.errorText}>Location data unavailable</Text>
      </View>
    );
  }

  // SAFEGUARD: Use fallback empty object for districts
  const districts = (addressData[selectedState] && typeof addressData[selectedState] === 'object') 
    ? addressData[selectedState] 
    : {};
    
  // SAFEGUARD: Use fallback empty array for villages
  const villages = (districts[selectedDistrict] && Array.isArray(districts[selectedDistrict])) 
    ? districts[selectedDistrict] 
    : [];

  const handleStateChange = (itemValue) => {
    if (!isMountedRef.current) return;
    
    setSelectedState(itemValue);
    // Reset dependent fields when state changes
    if (selectedDistrict) {
      setSelectedDistrict("");
    }
    if (selectedVillage) {
      setSelectedVillage("");
    }
  };

  const handleDistrictChange = (itemValue) => {
    if (!isMountedRef.current) return;
    
    setSelectedDistrict(itemValue);
    // Reset village when district changes
    if (selectedVillage) {
      setSelectedVillage("");
    }
  };

  const handleVillageChange = (itemValue) => {
    if (!isMountedRef.current) return;
    
    setSelectedVillage(itemValue);
  };

  return (
    <View>
      <Text style={styles.label}>State</Text>
      <View style={styles.pickerContainer}>
        <Picker 
          selectedValue={selectedState} 
          onValueChange={handleStateChange}
        >
          <Picker.Item label="Select State" value="" />
          {Object.keys(addressData).map((stateName) => (
            <Picker.Item 
              key={stateName} 
              label={stateName.replace(/_/g, " ")} 
              value={stateName} 
            />
          ))}
        </Picker>
      </View>

      {selectedState && Object.keys(districts).length > 0 && (
        <>
          <Text style={styles.label}>District</Text>
          <View style={styles.pickerContainer}>
            <Picker 
              selectedValue={selectedDistrict} 
              onValueChange={handleDistrictChange}
            >
              <Picker.Item label="Select District" value="" />
              {Object.keys(districts).map((distName) => (
                <Picker.Item 
                  key={distName} 
                  label={distName.replace(/_/g, " ")} 
                  value={distName} 
                />
              ))}
            </Picker>
          </View>
        </>
      )}

      {selectedDistrict && villages.length > 0 && (
        <>
          <Text style={styles.label}>Village</Text>
          <View style={styles.pickerContainer}>
            <Picker 
              selectedValue={selectedVillage} 
              onValueChange={handleVillageChange}
            >
              <Picker.Item label="Select Village" value="" />
              {villages.map((villageName, index) => (
                <Picker.Item 
                  key={`${villageName}-${index}`} 
                  label={villageName.replace(/_/g, " ")} 
                  value={villageName} 
                />
              ))}
            </Picker>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#374151', 
    marginBottom: 8, 
    marginTop: 16 
  },
  pickerContainer: { 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    justifyContent: 'center' 
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    padding: 16,
  }
});

export default LocationSelector;