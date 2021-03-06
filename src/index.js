import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import store from './store';
import { Provider } from 'react-redux';
import './assets/boxicons-2.0.7/css/boxicons.min.css';

import './assets/styles/grid.css';
import './assets/styles/theme.css';
import { createBrowserHistory } from 'history';
import { Router } from 'react-router-dom';

const history = createBrowserHistory();
document.title = 'VKN Social Media';

ReactDOM.render(
    <Provider store={store}>
        <Router history={history}>
            <App waitBeforeShow={500} />
        </Router>
    </Provider>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
