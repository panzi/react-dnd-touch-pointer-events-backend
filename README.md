# react-dnd-touch-pointer-events-backend

[![npm version](https://badge.fury.io/js/react-dnd-touch-pointer-events-backend.svg)](https://badge.fury.io/js/react-dnd-touch-pointer-events-backend)

Touch (iOS, Android, ...) and Pointer Events (Windows Phone) backend for React
Drag and Drop library http://gaearon.github.io/react-dnd

### Usage

```js
import { DragDropContext } from 'react-dnd';
import TouchBackend from 'react-dnd-touch-pointer-events-backend';

const App = { ... };

const AppContainer = DragDropContext(TouchBackend)(App);
```

### Credits
Inspired by [Mouse Backend](https://github.com/zyzo/react-dnd-mouse-backend) &
[Touch Backend](https://github.com/yahoo/react-dnd-touch-backend).

### MIT License

Copyright (c) 2016 Mathias Panzenböck

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
