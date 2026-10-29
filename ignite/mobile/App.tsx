import { StatusBar } from 'expo-status-bar';

import { Background } from './src/components/Background';

export default function App() {
  return (
    <Background>
      {/* No Android o app é sempre edge-to-edge: a status bar já é transparente */}
      <StatusBar style="light" />

    </Background>
  );
}
