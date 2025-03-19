import { View, Text, Button, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { observer } from '@legendapp/state/react'
import { store$ } from './store'
import { useState } from 'react'

interface UserAccount {
  id: number
  account: string
  nickname?: string
  balance: number
  view_only: boolean
}

export const TaskList = observer(() => {
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
    <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View>
        <Text style={{ fontWeight: 'bold' }}>{item.nickname}</Text>
        <Text style={{ fontSize: 12, color: '#666' }}>{item.account}</Text>
        <Text>Balance: ${item.balance.toFixed(2)}</Text>
        <Text style={{ color: item.view_only ? 'gray' : 'green' }}>
          {item.view_only ? 'View Only' : 'Full Access'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteAccount(item.id)}>
        <Text style={{ color: 'red', fontSize: 20 }}>×</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View>
      <Text>User Accounts: {store$.userAccounts.length}</Text>
      <View style={{ padding: 10, gap: 10 }}>
        <TextInput
          value={newAccount}
          onChangeText={setNewAccount}
          placeholder="Enter account address"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 8,
            borderRadius: 4
          }}
        />
        <TextInput
          value={newNickname}
          onChangeText={setNewNickname}
          placeholder="Enter nickname (optional)"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 8,
            borderRadius: 4
          }}
        />
        <TextInput
          value={newBalance}
          onChangeText={setNewBalance}
          placeholder="Enter initial balance"
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 8,
            borderRadius: 4
          }}
        />
        <Button title="Add Account" onPress={addAccount} />
      </View>
      <FlatList
        data={store$.userAccounts.get()}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  )
})
