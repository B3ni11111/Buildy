import { useState } from 'react';
import './App.css';
import Form from './components/Form';
import InfoDisplay from './components/InfoDisplay';

interface UserData {
  name: string;
  type: 'A' | 'B';
}

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleSubmit = (data: UserData) => {
    setUserData(data);
  };

  const handleReset = () => {
    setUserData(null);
  };

  return (
    <div className="app">
      {userData === null ? (
        <Form onSubmit={handleSubmit} />
      ) : (
        <InfoDisplay data={userData} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
