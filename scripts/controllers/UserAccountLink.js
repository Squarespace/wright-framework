import { UserAccounts } from '@sqs/core';

function UserAccountLink(element) {
  const init = () => {
    const unusedSelector = UserAccounts.isUserAuthenticated() ? '.unauth' : '.auth';
    const unusedNode = element.querySelector(unusedSelector);
    if (unusedNode) {
      element.removeChild(unusedNode);
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