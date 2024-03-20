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
  const firstName = user.first_name;

  const isAlreadyInList = bannedUsers.some(
    (bannedUser) => bannedUser.id === user.id
  );

  if (isAlreadyInList) {
    console.log(
      `El usuario @${firstName} ya se encontraba en la lista de baneo`
    );

    return;
  }

  bannedUsers.push(user);

  fs.writeFile(filePath, JSON.stringify(bannedUsers), (error) => {
    if (error) {
      console.log(
        `Ocurrio un error al tratar de guardar al usuario @${firstName} en la lista de baneo`
      );
      console.log(error);
      return;
    }

    console.log(
      `El usuario @${firstName} fue almacenado correctamente en la lista de baneo`
    );
  });
}

// TODO: create this function (if needed)
export function removeBannedUser(username) {}

export function getBannedUserByFirstName(firstName) {
  const users = getFileDataSync();

  const bannedUser = users.find(
    (bannedUser) =>
      bannedUser.first_name.toLowerCase() === firstName.toLowerCase()
  );

  return bannedUser;
}
