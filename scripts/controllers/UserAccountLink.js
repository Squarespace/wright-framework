<<<<<<< HEAD
import { UserAccounts } from '@sqs/core';

function UserAccountLink(element) {
  const init = () => {
    const unusedSelector = UserAccounts.isUserAuthenticated() ? '.unauth' : '.auth';
    const unusedNode = element.querySelector(unusedSelector);
    if (unusedNode) {
      element.removeChild(unusedNode);
=======
import { UserAccounts } from '@squarespace/core';

function UserAccountLink(element) {
  const init = () => {
    if (UserAccounts.isUserAuthenticated()) {
      element.innerHTML = 'My Account';
>>>>>>> Adding user account link in header
    }
    element.classList.add('loaded');
  };

  const handleClick = (e) => {
    UserAccounts.openAccountScreen();
  };

  const bindListeners = () => {
    element.addEventListener('click', handleClick);
  };

  const destroy = () => {
    element.removeEventListener('click', handleClick);
  };

  init();
  bindListeners();

  return {
    destroy: destroy
  };
}

export default UserAccountLink;