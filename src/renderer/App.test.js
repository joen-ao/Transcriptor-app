import React from 'react';

const App = () => {
  return React.createElement('div', { style: { padding: '20px' } }, 
    React.createElement('h1', null, 'Test App'),
    React.createElement('p', null, 'Funcionando sin TypeScript')
  );
};

export default App;