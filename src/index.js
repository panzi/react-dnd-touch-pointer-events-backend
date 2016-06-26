// React DnD Backend for TOuch Devices
// Based on: https://github.com/zyzo/react-dnd-mouse-backend
// This also supports Windows Phone, which uses a different touch event API.

const getEventClientOffset = navigator.msPointerEnabled ?
	event => {
		const x = event.clientX;
		const y = event.clientY;
		return { x, y };
	} :
	event => {
		const length = event.touches.length;
		if (length === 0) {
			return null;
		}
		let x = 0;
		let y = 0;
		for (let i = 0; i < length; ++ i) {
			const touch = event.touches.item(i);
			x += touch.clientX;
			y += touch.clientY;
		}
		return {
			x: x / length,
			y: y / length,
		};
	};

const isStillDragging = navigator.msPointerEnabled ?
	// TODO: track pointerId and only react to the one pointer that started the drag?
	event => false :

	// Some fingers still touch the surface.
	// NOTE: In Firefox event.touches contains the ended touch, in Chrome it doesn't.
	event => event.changedTouches.length < event.touches.length;

const ELEMENT_NODE = 1;
function getNodeClientOffset(node) {
	const el = node.nodeType === ELEMENT_NODE
		? node
		: node.parentElement;

	if (!el) {
		return null;
	}

	const { top, left } = el.getBoundingClientRect();
	return { x: left, y: top };
}

export class TouchBackend {
	constructor(manager) {
		this.actions = manager.getActions();
		this.monitor = manager.getMonitor();
		this.registry = manager.getRegistry();

		this.sourceNodes = {};
		this.sourceNodesOptions = {};
		this.sourcePreviewNodes = {};
		this.sourcePreviewNodesOptions = {};
		this.targetNodes = {};
		this.targetNodeOptions = {};
		this.touchClientOffset = {};

		this.getSourceClientOffset = this.getSourceClientOffset.bind(this);

		this.handleWindowMoveStart = this.handleWindowMoveStart.bind(this);
		this.handleWindowMoveStartCapture = this.handleWindowMoveStartCapture.bind(this);
		this.handleWindowMoveCapture = this.handleWindowMoveCapture.bind(this);
		this.handleWindowMoveEndCapture = this.handleWindowMoveEndCapture.bind(this);
	}

	setup() {
		if (typeof window === 'undefined') {
			return;
		}

		if (this.constructor.isSetUp) {
			throw new Error('Cannot have two DnD Touch backends at the same time');
		}

		this.constructor.isSetUp = true;
		if (navigator.msPointerEnabled) {
			window.addEventListener('MSPointerDown', this.handleWindowMoveStartCapture, true);
			window.addEventListener('MSPointerDown', this.handleWindowMoveStart, false);
			window.addEventListener('MSPointerMove', this.handleWindowMoveCapture, true);
			window.addEventListener('MSPointerUp', this.handleWindowMoveEndCapture, true);
		} else {
			window.addEventListener('touchstart', this.handleWindowMoveStartCapture, true);
			window.addEventListener('touchstart', this.handleWindowMoveStart, false);
			window.addEventListener('touchmove', this.handleWindowMoveCapture, true);
			window.addEventListener('touchend', this.handleWindowMoveEndCapture, true);
			window.addEventListener('touchcancel', this.handleWindowMoveEndCapture, true);
		}
	}

	getSourceClientOffset(sourceId) {
		return getNodeClientOffset(this.sourceNodes[sourceId]);
	}

	teardown() {
		if (typeof window === 'undefined') {
			return;
		}

		this.constructor.isSetUp = false;

		this.touchClientOffset = {};
		if (navigator.msPointerEnabled) {
			window.removeEventListener('MSPointerDown', this.handleWindowMoveStartCapture, true);
			window.removeEventListener('MSPointerDown', this.handleWindowMoveStart, false);
			window.removeEventListener('MSPointerMove', this.handleWindowMoveCapture, true);
			window.removeEventListener('MSPointerUp', this.handleWindowMoveEndCapture, true);
		} else {
			window.removeEventListener('touchstart', this.handleWindowMoveStartCapture, true);
			window.removeEventListener('touchstart', this.handleWindowMoveStart, false);
			window.removeEventListener('touchmove', this.handleWindowMoveCapture, true);
			window.removeEventListener('touchend', this.handleWindowMoveEndCapture, true);
			window.removeEventListener('touchcancel', this.handleWindowMoveEndCapture, true);
		}
	}

	connectDragSource(sourceId, node) {
		this.sourceNodes[sourceId] = node;

		const handleMoveStart = this.handleMoveStart.bind(this, sourceId);
		node.addEventListener(navigator.msPointerEnabled ?
			'MSPointerDown' : 'touchstart', handleMoveStart);

		return () => {
			delete this.sourceNodes[sourceId];
			node.removeEventListener(navigator.msPointerEnabled ?
				'MSPointerDown' : 'touchstart', handleMoveStart);
		};
	}

	connectDragPreview(sourceId, node, options) {
		this.sourcePreviewNodeOptions[sourceId] = options;
		this.sourcePreviewNodes[sourceId] = node;

		return () => {
			delete this.sourcePreviewNodes[sourceId];
			delete this.sourcePreviewNodeOptions[sourceId];
		};
	}

	connectDropTarget(targetId, node) {
		this.targetNodes[targetId] = node;

		return () => {
			delete this.targetNodes[targetId];
		};
	}

	handleWindowMoveStartCapture() {
		this.moveStartSourceIds = [];
	}

	handleMoveStart(sourceId) {
		this.moveStartSourceIds.unshift(sourceId);
	}

	handleWindowMoveStart(event) {
		const clientOffset = getEventClientOffset(event);
		if (clientOffset) {
			this.touchClientOffset = clientOffset;
		}
	}

	handleWindowMoveCapture(event) {
		const { moveStartSourceIds } = this;
		const clientOffset = getEventClientOffset(event);
		if (!clientOffset) {
			return;
		}
		if (!this.monitor.isDragging()
			&& this.touchClientOffset.hasOwnProperty('x') && moveStartSourceIds &&
		(
			this.touchClientOffset.x !== clientOffset.x ||
			this.touchClientOffset.y !== clientOffset.y
		)) {
			this.moveStartSourceIds = null;
			this.actions.beginDrag(moveStartSourceIds, {
				clientOffset: this.touchClientOffset,
				getSourceClientOffset: this.getSourceClientOffset,
				publishSource: false,
			});
		}
		if (!this.monitor.isDragging()) {
			return;
		}

		const sourceNode = this.sourceNodes[this.monitor.getSourceId()];
		this.installSourceNodeRemovalObserver(sourceNode);

		this.actions.publishDragSource();

		event.preventDefault();

		const matchingTargetIds = Object.keys(this.targetNodes)
			.filter(targetId => {
				const boundingRect =
					this.targetNodes[targetId].getBoundingClientRect();
				return clientOffset.x >= boundingRect.left &&
					clientOffset.x <= boundingRect.right &&
					clientOffset.y >= boundingRect.top &&
					clientOffset.y <= boundingRect.bottom;
			});

		this.actions.hover(matchingTargetIds, { clientOffset });
	}

	handleWindowMoveEndCapture(event) {
		if (isStillDragging(event)) {
			// Some fingers still touch the surface.
			return;
		}
		if (!this.monitor.isDragging() || this.monitor.didDrop()) {
			this.moveStartSourceIds = null;
			return;
		}

		event.preventDefault();

		this.touchClientOffset = {};

		this.uninstallSourceNodeRemovalObserver();
		this.actions.drop();
		this.actions.endDrag();
	}

	installSourceNodeRemovalObserver(node) {
		this.uninstallSourceNodeRemovalObserver();

		this.draggedSourceNode = node;
		this.draggedSourceNodeRemovalObserver = new window.MutationObserver(() => {
			if (!node.parentElement) {
				this.resurrectSourceNode();
				this.uninstallSourceNodeRemovalObserver();
			}
		});

		if (!node || !node.parentElement) {
			return;
		}

		this.draggedSourceNodeRemovalObserver.observe(
			node.parentElement,
			{ childList: true }
		);
	}

	resurrectSourceNode() {
		this.draggedSourceNode.style.display = 'none';
		this.draggedSourceNode.removeAttribute('data-reactid');
		document.body.appendChild(this.draggedSourceNode);
	}

	uninstallSourceNodeRemovalObserver() {
		if (this.draggedSourceNodeRemovalObserver) {
			this.draggedSourceNodeRemovalObserver.disconnect();
		}

		this.draggedSourceNodeRemovalObserver = null;
		this.draggedSourceNode = null;
	}
}

export default function createTouchBackend(manager) {
	return new TouchBackend(manager);
}
