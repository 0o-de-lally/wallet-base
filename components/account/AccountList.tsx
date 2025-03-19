import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { observer } from '@legendapp/state/react'
import { store$ } from './store'
import { useState } from 'react'
import { sharedStyles } from '@/styles/shared'

interface UserAccount {
  id: number
  account: string
  nickname?: string
  balance: number
  view_only: boolean
}

export const AccountList = observer(() => {
  const [newAccount, setNewAccount] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [newBalance, setNewBalance] = useState('')

  const addAccount = () => {
    if (newAccount.trim()) {
      store$.userAccounts.push({
        id: Date.now(),
        account: newAccount.trim(),
        nickname: newNickname.trim() || newAccount.trim(),
        balance: parseFloat(newBalance) || 0,
        view_only: false
      })
      setNewAccount('')
      setNewNickname('')
      setNewBalance('')
    }
  }

  const deleteAccount = (id: number) => {
    const index = store$.userAccounts.findIndex(account => account.get().id === id)
    if (index !== -1) {
      store$.userAccounts.splice(index, 1)
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
        <TextInput
          value={newAccount}
          onChangeText={setNewAccount}
          placeholder="Enter account address"
          style={sharedStyles.input}
        />
        <TextInput
          value={newNickname}
          onChangeText={setNewNickname}
          placeholder="Enter nickname (optional)"
          style={sharedStyles.input}
        />
        <TextInput
          value={newBalance}
          onChangeText={setNewBalance}
          placeholder="Enter initial balance"
          keyboardType="numeric"
          style={sharedStyles.input}
        />
        <TouchableOpacity onPress={addAccount} style={sharedStyles.button}>
          <Text style={sharedStyles.buttonText}>Add Account</Text>
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
