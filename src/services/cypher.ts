
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

    init = async () => {
        return this.createID()
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