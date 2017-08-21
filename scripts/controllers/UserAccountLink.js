import { UserAccounts } from '@squarespace/core';

function UserAccountLink(element) {
  const init = () => {
    const unusedSelector = UserAccounts.isUserAuthenticated() ? '.unauth' : '.auth';
    const textLink = element.querySelector('.user-accounts-text-link');
    const unusedNode = textLink.querySelector(unusedSelector);
    if (unusedNode) {
      textLink.removeChild(unusedNode);
    }
    element.classList.add('loaded');
  };

  const handleClick = (e) => {
    e.preventDefault();
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
    destroy
  };
}

export default UserAccountLink;
