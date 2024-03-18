// Requiring fs module
import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../data/bannedUsers.json');

function getFileDataSync() {
  const data = fs.readFileSync(filePath, 'utf8');

  return JSON.parse(data);
}

export function saveBannedUser(user) {
  const bannedUsers = getFileDataSync();

  const isAlreadyInList = bannedUsers.some(
    (bannedUser) => bannedUser.id === user.id
  );

  if (isAlreadyInList) {
    console.log(
      'El usuario ya estaba registrado en la lista de usuarios baneados'
    );
    return;
  }

  bannedUsers.push(user);

  fs.writeFile(filePath, JSON.stringify(bannedUsers), (error) => {
    if (error) {
      console.log('No se puedo guardar al usuario baneado');
      console.log(error);
      return;
    }

    console.log('Usuario baneado guardado correctamente');
  });
}

export function removeBannedUser(username) {}

export function getBannedUserByFirstName(firstName) {
  const users = getFileDataSync();

  const bannedUser = users.find(
    (bannedUser) =>
      bannedUser.first_name.toLowerCase() === firstName.toLowerCase()
  );

  return bannedUser;
}
