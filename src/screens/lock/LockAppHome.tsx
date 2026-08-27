import { StyleSheet, Text } from 'react-native';

const LockAppHome = () => {
  return (
    <>
      <Text style={styles.header}>하이</Text>
    </>
  );
};

export default LockAppHome;

const styles = StyleSheet.create({
  header: {
    paddingTop: 259,
    fontSize: 50,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
});
