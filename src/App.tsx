import { useState } from 'react';
import './App.css';
import Form from './components/Form';
import InfoDisplay from './components/InfoDisplay';
import UserInfo from './components/UserInfo';
import { useAuth } from './context/AuthContext';

interface UserData {
  name: string;
  type: 'A' | 'B';
}

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const { logout } = useAuth();

  const handleSubmit = (data: UserData) => {
    setUserData(data);
  };

  const handleReset = () => {
    setUserData(null);
  };

  return (
    <div className="app">
      <UserInfo />
      <button
        onClick={logout}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#e53e3e',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
          zIndex: 999,
        }}
      >
        Logout
      </button>
      {userData === null ? (
        <Form onSubmit={handleSubmit} />
      ) : (
        <InfoDisplay data={userData} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
