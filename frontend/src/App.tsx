import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MachinesPage } from './pages/MachinesPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'incidents' | 'machines'>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('INC-M204-001');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>('M-204');

  const handleNavigateToIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setCurrentTab('incidents');
  };

  const handleNavigateToMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setCurrentTab('machines');
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      activeIncidentCount={1}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage
          onNavigateToIncident={handleNavigateToIncident}
          onNavigateToMachine={handleNavigateToMachine}
        />
      )}
      {currentTab === 'incidents' && (
        <IncidentsPage
          selectedIncidentId={selectedIncidentId}
        />
      )}
      {currentTab === 'machines' && (
        <MachinesPage
          selectedMachineId={selectedMachineId}
        />
      )}
    </Layout>
  );
};

export default App;
