'use strict';

// Modules
const React = require('react'),
	ReactDOMServer = require('react-dom/server');

const LoadableData = require('../');

// Imports
const App = require('./app');

// Run
renderComponent(App).then(res => {
	console.log('done!');
	console.log('data:', res.data);
	console.log('html:', res.html);
});

function renderComponent(Component, props) {
	const data = {}, promises = [];

	console.log('creating element');
	const element = (
		<LoadableData.ServerProvider data={data} promises={promises}>
			<Component {...props}/>
		</LoadableData.ServerProvider>
	);

	return renderElement(element, data, promises).then(html => ({html, data}));
}

function renderElement(element, data, promises) {
	return next(true);

	function next(first) {
		console.log('rendering', {data, promises});
		const html = ReactDOMServer.renderToString(element);
		console.log('rendered', {data, promises});
		console.log('html:', html);

		if (promises.length == 0) {
			console.log('complete:', {data, promises});
			if (first) return Promise.resolve(html);
			return html;
		}

		return Promise.all(promises).then(() => {
			return next(false);
		});
	}
}
