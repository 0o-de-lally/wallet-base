import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { observer } from '@legendapp/state/react'
import { store$ } from './store'
import { useState } from 'react'
import { sharedStyles } from '@/styles/shared'
import { KeychainService } from '@/services/KeychainService'
import { initWallet } from '@/util/init'
import { ErrorLogger } from '@/util/errorLogging'

interface UserAccount {
  id: number
  account: string
  nickname?: string
  balance: number
  view_only: boolean
  hasStoredKey?: boolean
}

export const AccountList = observer(() => {
  const [account, setAccount] = useState('')
  const [nickname, setNickname] = useState('')
  const [balance, setBalance] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [error, setError] = useState('')

  const isDuplicateAddress = (address: string) => {
    return store$.userAccounts.get().some(acc => acc.account.toLowerCase() === address.toLowerCase())
  }

  const handleSubmit = async () => {
    try {
      // Clear previous errors
      setError('')

      if (mnemonic.trim()) {
        try {
          const wallet = await initWallet(mnemonic.trim());
          const address = wallet.getAddress().toString();

          if (isDuplicateAddress(address)) {
            const dupError = new Error('Duplicate wallet address');
            ErrorLogger.logError(dupError);
            setError('This wallet address already exists in your accounts')
            return
          }

          const accountId = Date.now().toString();
          const privateKey = wallet.account.privateKey;

          const success = await KeychainService.storePrivateKey(accountId, JSON.stringify(privateKey));
          if (!success) {
            const keyError = new Error('Failed to store private key');
            ErrorLogger.logError(keyError);
            throw keyError;
          }

          // Add to store only after successful key storage
          store$.userAccounts.set([
            ...store$.userAccounts.get(),
            {
              id: parseInt(accountId),
              account: address,
              nickname: nickname.trim() || 'Account ' + (store$.userAccounts.length + 1),
              balance: 0,
              view_only: false,
              hasStoredKey: true
            }
          ]);

          // Clear form on success
          setAccount('')
          setNickname('')
          setBalance('')
          setMnemonic('')
          setError('')
        } catch (keyError) {
          ErrorLogger.logError(keyError);
          throw new Error('Failed to store account credentials: ' + keyError.message);
        }
      } else {
        // Just track path
        if (!account.trim()) {
          const validationError = new Error('Missing account address');
          ErrorLogger.logError(validationError);
          setError('Please enter an account address to track')
          return
        }

        if (isDuplicateAddress(account.trim())) {
          const dupError = new Error('Duplicate address in tracking mode');
          ErrorLogger.logError(dupError);
          setError('This address already exists in your accounts')
          return
        }

        store$.userAccounts.push({
          id: Date.now(),
          account: account.trim(),
          nickname: nickname.trim() || account.trim(),
          balance: parseFloat(balance) || 0,
          view_only: true
        })
      }

      // Clear form on success
      setAccount('')
      setNickname('')
      setBalance('')
      setMnemonic('')
      setError('')
    } catch (error) {
      console.error('Error processing account:', error);
      ErrorLogger.logError(error);
      setError('Failed to process account: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const deleteAccount = (id: number) => {
    try {
      const index = store$.userAccounts.findIndex(account => account.get().id === id)
      if (index !== -1) {
        store$.userAccounts.splice(index, 1)
      } else {
        const error = new Error(`Failed to delete account: ID ${id} not found`);
        ErrorLogger.logError(error);
      }
    } catch (error) {
      ErrorLogger.logError(error);
      console.error('Error deleting account:', error);
    }
  }

  const renderItem = ({ item }: { item: UserAccount }) => (
    <View style={sharedStyles.card}>
      <View>
        <Text style={sharedStyles.heading}>{item.nickname}</Text>
        <Text style={sharedStyles.label}>{item.account}</Text>
        <Text style={sharedStyles.text}>Balance: ${item.balance.toFixed(2)}</Text>
        <Text style={[sharedStyles.text, { color: item.view_only ? 'gray' : 'green' }]}>
          {item.view_only ? 'View Only' : 'Full Access'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteAccount(item.id)} style={sharedStyles.button}>
        <Text style={sharedStyles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={sharedStyles.container}>
      <Text style={sharedStyles.heading}>User Accounts: {store$.userAccounts.length}</Text>
      <View style={sharedStyles.card}>
        {error ? <Text style={[sharedStyles.text, { color: 'red' }]}>{error}</Text> : null}
        <TextInput
          value={mnemonic}
          onChangeText={setMnemonic}
          placeholder="Enter recovery mnemonic (optional for tracking)"
          style={[sharedStyles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
        />
        <TextInput
          value={account}
          onChangeText={setAccount}
          placeholder="Enter account address (required for tracking)"
          style={sharedStyles.input}
          editable={!mnemonic.trim()}
        />
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="Enter nickname (optional)"
          style={sharedStyles.input}
        />
        <TextInput
          value={balance}
          onChangeText={setBalance}
          placeholder="Enter initial balance (for tracking)"
          keyboardType="numeric"
          style={sharedStyles.input}
          editable={!mnemonic.trim()}
        />
        <TouchableOpacity onPress={handleSubmit} style={sharedStyles.button}>
          <Text style={sharedStyles.buttonText}>
            {mnemonic.trim() ? 'Recover Account' : 'Just Track'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={store$.userAccounts.get()}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  )
})
