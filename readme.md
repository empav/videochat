Videochat p2p with Webrtc:


Requirements:

- NodeJS (version >= 4) or latest.


Install:

- Run npm install


Configuration:

- Generate a self-signed key with openssh. See below.

- Grant execution to the main server file (chmod +x server.js)


Run:

- npm start (https://localhost:3000/chat/<number>)

- <number>: Chat number to work with


Generate a Self-signed certificate:

A certificate is not mandatory from a technical point of view. Nevertheless, it was decided that man-in-the-middle attacks would be far too common considering the openness of the web. Therefore a certificate, which is signed by a trusted certificate authority (CA), is demanded by the specification. The CA ensures that the certificate holder is really who he claims to be.
In the following we will use the openssl toolkit. The application will give us the ability to generate a private key using RSA encryption. We can also issue a certificate signing request (CSR). Furthermore the core library of the OpenSSL project can be used to generate self-signed certificates. These certificates can then be used for testing purposes. They should not be used publicly.
The first step is to create a private key. As an example we can use the following command, generating a file called server.enc.key.

openssl genrsa -des3 -out server.enc.key 1024

The generated RSA key is a 1024-bit key encrypted using triple DES. The file is human readable. As a slight variant we can also omit the -des3 option and change the strength of the encryption, e.g. to 2048. Even though we use a 1024-bit key in this example, we should consider 2048-bit the minimum length for real keys.
Once we have our key generated we need to issue a certificate signing request. A request can be generated using the following command.

openssl req -new -key server.enc.key -out server.csr

The created CSR is stored in the server.csr file. We will be required to self-sign this file.
Until this point it is required to enter the pass-phrase when using the key from the server.enc.key file. Since we will only use the certificate internally (and for testing purposes) we can think about removing the password protection. Removing the triple DES encryption from the key is done with the following command.

openssl rsa -in server.enc.key -out server.key

Here the original (encrypted) file server.enc.key is transformed to the (unencrypted) file server.key.
Finally we have to self-sign the certificate. The self-signed certificate will generate an error in browsers. The reason is that the signing certificate authority is unknown and therefore not trusted. To generate a temporary certificate server.crt we need to issue the following command:

openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

The created certificate will expire in 365 days after issuing.