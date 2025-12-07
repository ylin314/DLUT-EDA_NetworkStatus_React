import { useNetworkStatus } from './hooks/useNetworkStatus';
import NetworkTable from './components/NetworkTable';
import ActionButtons from './components/ActionButtons';
import Footer from './components/Footer';
import SakanaWidget from './components/SakanaWidget';
import './App.css';

function App() {
  const { data, loadData } = useNetworkStatus();

  const handleRefresh = () => {
    loadData();
  };

  return (
    <>
      <div className="content-wrapper">
        <h2>本机校园网状态</h2>
        <div className="table-container">
          <NetworkTable data={data} />
          <ActionButtons data={data} />
        </div>
      </div>
      <Footer />
      <SakanaWidget />
    </>
  );
}

export default App;
