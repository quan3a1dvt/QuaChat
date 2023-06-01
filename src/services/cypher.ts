
import {
    KeyHelper,
    SignedPublicPreKeyType,
    SignalProtocolAddress,
    SessionBuilder,
    PreKeyType,
    KeyPairType,
    SessionCipher,
    MessageType }
from '@privacyresearch/libsignal-protocol-typescript'
import {SignalProtocolStore} from './storage'

class cypher {
    registrationId: number
    identityKeyPair: KeyPairType
    store = new SignalProtocolStore()
    sessionBuilder: SessionBuilder
    senderSessionCipher: SessionCipher
    init = async () => {
        return this.createID()
    }
    createSession = async(recipientId, deviceId, keyBundle) => {
      const starterMessageBytes = Uint8Array.from([
        0xce,
        0x93,
        0xce,
        0xb5,
        0xce,
        0xb9,
        0xce,
        0xac,
        0x20,
        0xcf,
        0x83,
        0xce,
        0xbf,
        0xcf,
        0x85,
      ])
      const recipientAddress = new SignalProtocolAddress(recipientId, deviceId)
      this.sessionBuilder = new SessionBuilder(this.store, recipientAddress)
      await this.sessionBuilder.processPreKey(keyBundle)
      this.senderSessionCipher = new SessionCipher(this.store, recipientAddress)
      const ciphertext = await this.senderSessionCipher.encrypt(starterMessageBytes.buffer)
      console.log(ciphertext)
    }
    createID = async () => {
        this.registrationId = KeyHelper.generateRegistrationId()
        // storeSomewhereSafe(`registrationID`, registrationId)
      
        this.identityKeyPair = await KeyHelper.generateIdentityKeyPair()
        // storeSomewhereSafe('identityKey', identityKeyPair)
      
        const baseKeyId = KeyHelper.generateRegistrationId()
        const preKey = await KeyHelper.generatePreKey(baseKeyId)
        this.store.storePreKey(`${baseKeyId}`, preKey.keyPair)
      
        const signedPreKeyId = KeyHelper.generateRegistrationId()
        const signedPreKey = await KeyHelper.generateSignedPreKey(this.identityKeyPair, signedPreKeyId)
        this.store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair)
      
        // Now we register this with the server or other directory so all users can see them.
        // You might implement your directory differently, this is not part of the SDK.
      
        const publicSignedPreKey: SignedPublicPreKeyType = {
          keyId: signedPreKeyId,
          publicKey: signedPreKey.keyPair.pubKey,
          signature: signedPreKey.signature,
        }
      
        const publicPreKey: PreKeyType = {
          keyId: preKey.keyId,
          publicKey: preKey.keyPair.pubKey,
        }
        return {
            registrationId: this.registrationId,
            identityPubKey: this.identityKeyPair.pubKey,
            signedPreKey: publicSignedPreKey,
            oneTimePreKeys: [publicPreKey],
        }
      }
    constructor() {     
    }
}

export default new cypher()