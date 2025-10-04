const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 DigiTwin Studio - Secrets Setup');
console.log('==================================');
console.log('This will help you set up your Onshape API credentials securely.');
console.log('');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupSecrets() {
  try {
    console.log('Please enter your Onshape API credentials:');
    console.log('(You can find these in your Onshape Developer Portal)');
    console.log('');

    const accessKey = await askQuestion('Access Key: ');
    const secretKey = await askQuestion('Secret Key: ');
    const assemblyUrl = await askQuestion('Test Assembly URL (optional): ');

    if (!accessKey || !secretKey) {
      console.log('❌ Access Key and Secret Key are required!');
      rl.close();
      return;
    }

    const secrets = {
      onshape: {
        accessKey: accessKey.trim(),
        secretKey: secretKey.trim(),
        testAssemblyUrl: assemblyUrl.trim() || ''
      }
    };

    fs.writeFileSync('secrets.json', JSON.stringify(secrets, null, 2));
    
    console.log('');
    console.log('✅ Secrets saved to secrets.json');
    console.log('🔒 This file is automatically ignored by git for security');
    console.log('');
    console.log('You can now test the backend authentication by visiting:');
    console.log('http://localhost:3001/backend-test');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up secrets:', error.message);
  } finally {
    rl.close();
  }
}

setupSecrets();

