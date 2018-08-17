'use strict';

// Modules
const React = require('react'),
	ReactDOMServer = require('react-dom/server');

const LoadableData = require('../');

// Imports
const App = require('./app');

// Run
render(App).then(res => {
	console.log('done!');
	console.log('data:', res.data);
	console.log('html:', res.html);
});

function render(Component, props) {
	const data = [], promises = [];

	console.log('creating element');
	const element = (
		<LoadableData.ServerProvider data={data} promises={promises}>
			<Component {...props}/>
		</LoadableData.ServerProvider>
	);

	return next(true);

	function next(first) {
		console.log('rendering', {data, promises});
		const html = ReactDOMServer.renderToString(element);
		console.log('rendered', {data, promises});
		console.log('html:', html);

		if (promises.length == 0) {
			console.log('complete:', {data, promises});
			const res = {html, data};
			if (first) return Promise.resolve(res);
			return res;
		}

		return Promise.all(promises).then(() => {
			return next(false);
		});
	}
}
