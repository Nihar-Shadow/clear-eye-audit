# FraudShield AI (Clear Eye Audit)

**Public Transaction Anomaly Detection System**

FraudShield AI is a specialized tool designed for government auditors to detect anomalies, potential fraud, and suspicious patterns in public transaction data. It combines AI-powered anomaly detection (Isolation Forest) with rule-based heuristics to identify high-risk transactions with 100% explainability.

## ✨ Features

- **AI Anomaly Detection**: Uses Isolation Forest algorithm to identify statistical outliers in transaction data.
- **Rule-Based Detection**: Automatically flags transactions based on 5 key fraud patterns:
  - Duplicate payments
  - Excessive amounts (deviations from department averages)
  - Shared accounts (vendor/beneficiary overlap)
  - Round dollar amounts (suspicious round numbers)
  - Weekend/Holiday transactions
- **Full Explainability**: "Glass-box" AI approach – understand exactly *why* a transaction was flagged (e.g., "Amount is 3.5x higher than department average").
- **Auditor Workflow**: 
  - Upload transaction datasets (CSV/JSON).
  - Review critical alerts and risk scores.
  - Annotate cases (Mark for Review, Clear, Escalate).
  - Track review history.
- **Interactive Dashboard**: Visualizes risk distribution, critical alerts, and department-wise analysis.

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn-ui
- **Icons**: Lucide React
- **Charts**: Recharts

## 🚀 Getting Started

### Prerequisites

- Node.js & npm installed

### Installation

1.  Clone the repository:
    ```sh
    git clone <repository-url>
    cd clear-eye-audit
    ```

2.  Install dependencies:
    ```sh
    npm install
    ```

3.  Start the development server:
    ```sh
    npm run dev
    ```

4.  Open your browser at `http://localhost:8080` (or the port shown in your terminal).

## 📖 Usage

1.  **Upload Data**: Go to the "Upload Data" tab and drop your transaction dataset.
2.  **View Dashboard**: Check the "Dashboard" tab for high-level stats and critical alerts.
3.  **Analyze Transactions**: Switch to the "Transactions" tab. Click on any high-risk transaction to open the **Explainability Panel**.
4.  **Take Action**: Use the panel to review the AI score breakdown, checking triggered rules, and adding auditor notes.

## 🛡️ Privacy & Security

This tool is designed for **internal government audit use**. Ensure that any uploaded data complies with your organization's data handling policies. The current version runs client-side processing for demonstration purposes.

---

*Demo for Government Audit Hackathon 2024*
