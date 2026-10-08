import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Login from './src/pages/login/index';
// import Home from './src/pages/home/home';
//import Cadastro from './src/pages/cadastro/cadastro';

export default function App() {
  return (
      //<Home />
      <Login />
      //<Cadastro />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
