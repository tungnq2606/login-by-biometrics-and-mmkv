import {Text, SafeAreaView, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';
import {getUniqueId} from 'react-native-device-info';
import RNFS from 'react-native-fs';

import {MMKV} from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'mmkv-biometrics',
  path: `${RNFS.DocumentDirectoryPath}/mmkv`,
  encryptionKey: 'hello',
});

const App = () => {
  useEffect(() => {
    const rnBiometrics = new ReactNativeBiometrics();
    const loginByBiometrics = async () => {
      try {
        const {available, biometryType} =
          await rnBiometrics.isSensorAvailable();
        const payload = await getUniqueId();

        if (
          available &&
          (biometryType === BiometryTypes.TouchID ||
            biometryType === BiometryTypes.FaceID ||
            biometryType === BiometryTypes.Biometrics)
        ) {
          const exitsBiometricKey = await rnBiometrics.biometricKeysExist();
          if (exitsBiometricKey) {
            await rnBiometrics.createKeys();
          }
          rnBiometrics
            .createSignature({
              promptMessage: 'Sign in',
              payload: payload,
            })
            .then(resultObject => {
              const {success, signature, error} = resultObject;
              if (success) {
                storage.set('signature', signature || '');
              } else {
                console.log(error);
              }
            })
            .catch(error => console.log('createSignature error', error));
        } else {
          console.log('Biometrics not supported');
        }
      } catch (error) {
        console.log(error);
      }
    };

    loginByBiometrics();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login with Biometrics demo app</Text>
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
  title: {fontSize: 20, color: '#000'},
});
export default App;
