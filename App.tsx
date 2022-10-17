import {
  Text,
  SafeAreaView,
  StyleSheet,
  Switch,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';
import {getUniqueId, isEmulator} from 'react-native-device-info';
import RNFS from 'react-native-fs';

import {MMKV} from 'react-native-mmkv';

export const successLoginStorage = new MMKV({
  id: 'mmkv-biometrics',
  path: `${RNFS.DocumentDirectoryPath}/mmkv/login/success`,
  encryptionKey: 'my-encryption-key',
});

export const failedLoginStorage = new MMKV({
  id: 'mmkv-biometrics',
  path: `${RNFS.DocumentDirectoryPath}/mmkv/login/failed`,
  encryptionKey: 'my-encryption-key',
});

export const cancelLoginStorage = new MMKV({
  id: 'mmkv-biometrics',
  path: `${RNFS.DocumentDirectoryPath}/mmkv/login/cancel`,
  encryptionKey: 'my-encryption-key',
});

const App = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const rnBiometrics = new ReactNativeBiometrics();

  const toggleSwitch = async () => {
    const _isEmulator = await isEmulator();
    if (_isEmulator) {
      return Alert.alert('Biometrics not supported on emulator');
    }
    const {available, biometryType} = await rnBiometrics.isSensorAvailable();
    setIsEnabled(previousState => !previousState);
    if (
      available &&
      (biometryType === BiometryTypes.TouchID ||
        biometryType === BiometryTypes.FaceID ||
        biometryType === BiometryTypes.Biometrics)
    ) {
      if (!isEnabled) {
        try {
          await rnBiometrics.createKeys();
        } catch (error) {
          Alert.alert('An error occurred');
        }
      } else {
        try {
          await rnBiometrics.deleteKeys();
        } catch (error) {
          Alert.alert('An error occurred');
        }
      }
    }
  };

  const loginByBiometrics = async () => {
    const payload = await getUniqueId();
    const countSuccess: number =
      successLoginStorage.getNumber('count.success') || 0;
    const countCancel: number =
      cancelLoginStorage.getNumber('count.cancel') || 0;
    const countFailed: number =
      failedLoginStorage.getNumber('count.failed') || 0;
    rnBiometrics
      .createSignature({
        promptMessage: 'Sign in',
        payload: payload,
      })
      .then(resultObject => {
        const {success} = resultObject;
        if (success) {
          successLoginStorage.set('count.success', countSuccess + 1);
          Alert.alert(
            'Login success',
            `Login success count : ${
              countSuccess + 1
            }\n Login cancel count : ${countCancel}\n Login failed count : ${countFailed}`,
          );
        } else {
          cancelLoginStorage.set('count.cancel', countCancel + 1);
        }
      })
      .catch(() => {
        Alert.alert('Login failed', 'Login failed. Please try again');
        failedLoginStorage.set('count.failed', countFailed + 1);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login with Biometrics demo app</Text>
      <View style={styles.switchContainer}>
        <Switch
          trackColor={{false: '#767577', true: '#81b0ff'}}
          thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
        <Text style={styles.status}>
          Login by biometrics: {isEnabled ? 'Enabled' : 'Disabled'}
        </Text>
      </View>
      {isEnabled && (
        <TouchableOpacity style={styles.button} onPress={loginByBiometrics}>
          <Text style={styles.buttonText}>Login by biometrics</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 100,
  },
  title: {fontSize: 22, color: '#000', marginBottom: 50},
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    color: '#000',
  },
  button: {
    width: 150,
    height: 40,
    backgroundColor: 'green',
    marginTop: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
  },
});
export default App;
