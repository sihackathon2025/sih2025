# Backend Flowcharts

This document contains two flowcharts that visualize the core backend processes of Project Sentinel: Data Ingestion and Alert Generation. The diagrams are written in the DOT language and can be rendered using Graphviz.

---

## 1. Data Ingestion Flowchart

This flowchart illustrates how data from various sources (ASHA workers, clinics, NGOs) is collected, processed by the Django backend, and stored in the PostgreSQL database.

```dot
digraph DataIngestion {
    graph [
        rankdir="TB",
        bgcolor="#f0f4f8",
        fontname="Helvetica, Arial, sans-serif",
        fontsize=16,
        label="Data Ingestion Flowchart",
        labelloc="t",
        pad="0.5",
        splines=ortho
    ];
    node [
        shape=box,
        style="rounded,filled",
        fillcolor="#ffffff",
        fontname="Helvetica, Arial, sans-serif",
        fontsize=11,
        penwidth=1.5
    ];
    edge [
        fontname="Helvetica, Arial, sans-serif",
        fontsize=10,
        penwidth=1.0
    ];

    // --- Nodes ---
    subgraph cluster_sources {
        label="Data Sources";
        style="rounded,filled";
        fillcolor="#e3f2fd";
        penwidth=1.5;
        node [fillcolor="#bbdefb", shape=cylinder];
        ASHA [label="ASHA Worker (Mobile App)"];
        Clinic [label="Clinic / Hospital"];
        NGO [label="NGO Survey"];
    }

    Backend [label="Django Backend
(data_collection app)", shape=Mdiamond, fillcolor="#c8e6c9"];
    Validation [label="Data Validation & Cleaning", shape=ellipse, fillcolor="#fff9c4"];
    DB [label="PostgreSQL Database", shape=cylinder, fillcolor="#ffcdd2"];

    subgraph cluster_tables {
        label="Database Tables";
        style="rounded,filled";
        fillcolor="#ffebee";
        penwidth=1.5;
        node [shape=note, fillcolor="#ffffff"];
        HealthReport [label="HealthReport"];
        ClinicReport [label="ClinicReport"];
        NgoSurvey [label="NgoSurvey"];
    }

    // --- Edges ---
    ASHA -> Backend [label="Submits Health Report"];
    Clinic -> Backend [label="Submits Clinic Report"];
    NGO -> Backend [label="Submits Survey Data"];

    Backend -> Validation [label="Processes Incoming Data"];
    Validation -> DB [label="Saves Cleaned Data"];

    DB -> HealthReport [style=dashed, arrowhead=none, color=gray];
    DB -> ClinicReport [style=dashed, arrowhead=none, color=gray];
    DB -> NgoSurvey [style=dashed, arrowhead=none, color=gray];
}
```

---

## 2. Alert Generation Logic Flowchart

This flowchart shows the asynchronous process that begins after data is saved. It details how the rule-based model analyzes the new data, generates an "Early Warning Alert" if specific conditions are met, and notifies officials via the dashboard.

```dot
digraph AlertGeneration {
    graph [
        rankdir="TB",
        bgcolor="#f0f4f8",
        fontname="Helvetica, Arial, sans-serif",
        fontsize=16,
        label="Alert Generation Logic Flowchart",
        labelloc="t",
        pad="0.5",
        splines=ortho
    ];
    node [
        shape=box,
        style="rounded,filled",
        fillcolor="#ffffff",
        fontname="Helvetica, Arial, sans-serif",
        fontsize=11,
        penwidth=1.5
    ];
    edge [
        fontname="Helvetica, Arial, sans-serif",
        fontsize=10,
        penwidth=1.0
    ];

    // --- Nodes ---
    DataSaved [label="Data Saved in PostgreSQL
(HealthReport, ClinicReport, etc.)", shape=folder, fillcolor="#ffcdd2"];
    CeleryTask [label="Asynchronous Celery Task Triggered", shape=cds, style="filled", fillcolor="#d1c4e9"];
    RuleEngine [label="Rule-Based Model Analysis
(utils/rule_based_model.py)", shape=Mdiamond, fillcolor="#c8e6c9"];
    DataFetch [label="Fetches recent data for a village", shape=ellipse, style=dashed, fillcolor="#e0e0e0"];
    TriggerAlert [label="Rule Condition Met?
(e.g., >5 fever cases in 2 days)", shape=diamond, fillcolor="#fff9c4", style=filled];
    GenerateAlert [label="Generate 'Early Warning Alert'", shape=ellipse, fillcolor="#b2dfdb"];
    SaveAlert [label="Save Alert to Database
(prediction.EarlyWarningAlert)", shape=cylinder, fillcolor="#ffcdd2"];
    Dashboard [label="Notify Officials on Dashboard
(CMO, DM)", shape=display, fillcolor="#bbdefb"];

    // --- Edges ---
    DataSaved -> CeleryTask [label="on data save"];
    CeleryTask -> RuleEngine [label="executes"];
    RuleEngine -> DataFetch [label="reads from", style=dashed, color=gray];
    DataFetch -> DataSaved [style=dashed, color=gray];

    RuleEngine -> TriggerAlert;
    TriggerAlert -> GenerateAlert [label="Yes", color="#4caf50", fontcolor="#4caf50", penwidth=2.0];
    TriggerAlert -> RuleEngine [label="No, continue analysis", color="#f44336", fontcolor="#f44336", style=dashed];

    GenerateAlert -> SaveAlert;
    SaveAlert -> Dashboard [label="Updates"];
}
```
