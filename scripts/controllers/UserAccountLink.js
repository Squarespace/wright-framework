import { UserAccounts } from '@squarespace/core';

function UserAccountLink(element) {
  const init = () => {
    if (UserAccounts.isUserAuthenticated()) {
      element.innerHTML = 'My Account';
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