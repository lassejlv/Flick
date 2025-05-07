## Flick DB

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/QjUR9X?referralCode=lasse)

A simple-fast-easy-to-use key-value databases, useful in small applications. Easy deploy it on railway!

### Node.js Example

```ts
import { FlickClient } from 'flickdb'

const client = new FlickClient({
  host: '',
  port: ,
})

await client.createCollection('users')

await client.set('users', 'john', { name: 'John Doe', age: 30 })

const john = await client.get('users', 'john')
console.log(john) // { name: "John Doe", age: 30 }
```

You can view the source code on github 
https://github.com/lassejlv/Flick/tree/main
