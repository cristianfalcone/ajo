# Ajo Documentation

A modern JavaScript library for building user interfaces with generator-based state management, efficient DOM updates, and streaming server-side rendering.

## Introduction

### What is Ajo?

Ajo is a lightweight, high-performance JavaScript library for building user interfaces that combines the efficiency of in-place DOM updates with the simplicity of generator-based state management. Designed with modern web development principles in mind, Ajo offers a unique approach that leverages native JavaScript features to provide an intuitive and powerful development experience.

**Core Features:**

*   **Generator-Based Components**: Use JavaScript generator functions (`function*`) for stateful components with built-in lifecycle management
*   **Efficient DOM Updates**: In-place DOM reconciliation minimizes DOM manipulation and maximizes performance
*   **Declarative JSX**: Write components using familiar JSX syntax with full TypeScript support
*   **Context API**: Share state across component trees without prop drilling
*   **Server-Side Rendering**: Complete SSR solution with streaming and hydration support
*   **Islands Architecture**: Selective hydration for maximum performance with minimal client-side JavaScript

### Design Philosophy

*   **Native-First**: Leverages native JavaScript features (generators, promises, iterators) instead of inventing new abstractions
*   **Minimal API Surface**: Small, focused API that's easy to learn and hard to misuse
*   **Performance by Default**: Efficient reconciliation and streaming built into the core
*   **Developer Experience**: Full TypeScript support, intuitive patterns, and clear error handling
*   **Flexibility**: Works equally well for static sites, SPAs, or hybrid applications

## Installation

Install Ajo using your preferred package manager:

```bash
# npm
npm install ajo

# pnpm
pnpm add ajo

# yarn
yarn add ajo
```

### Quick Start

Create your first component in minutes:

```javascript
import { render } from 'ajo';

const App = () => <h1>Hello, Ajo!</h1>;

render(<App />, document.body);
```

#### Targeted updates

When you only want to touch a slice of the container, pass the optional third (child) and fourth (ref) arguments to `render`. Rendering begins at the provided child node (inclusive) and stops before the ref node (exclusive), leaving siblings outside that window untouched.

```javascript
document.body.innerHTML = '<header>Header</header><main><p>Initial content</p></main><footer>Footer</footer>';

const start = document.body.querySelector('main');
const stop = document.body.querySelector('footer');

render(<main><p>Updated content</p></main>, document.body, start, stop);
```

In this example the header before `main` and the footer after it remain unchanged while the `<main>` subtree is replaced in place.

### Setup with Build Tools

#### Vite Configuration

For optimal development experience with Vite:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'ajo'`,
  },
});
```

#### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "ajo"
  }
}
```

## Core Concepts

### Components

Ajo supports two types of components: **stateless** (functional) and **stateful** (generator-based).

#### Stateless Components

Stateless components are pure functions that accept props and return JSX:

```javascript
const Greeting = ({ name }) => <p>Hello, {name}!</p>;

const UserCard = ({ user }) => (
  <div class="user-card">
    <h3>{user.name}</h3>
    <p>{user.email}</p>
  </div>
);
```

#### Stateful Components

Stateful components use generator functions to manage state and lifecycle:

```javascript
function* Counter() {

  let count = 0;

  const increment = () => this.next(() => count++);

  while (true) {
    yield (
      <button set:onclick={increment}>
        Count: {count}
      </button>
    );
  }
}
```

### Component Lifecycle

Generator components provide natural lifecycle management through `try...finally` blocks for cleanup:

```javascript
function* ComponentWithLifecycle() {

  console.log('Component mounted');
  
  try {
    while (true) {
      yield <>I'm alive!</>;
    }
  } finally {
    console.log('Component unmounted');
    // Cleanup logic here: remove event listeners, cancel timers, etc.
  }
}
```

For error handling within the component lifecycle, place `try...catch` inside the `while` loop:

```javascript
function* RobustComponent() {
  try {
    while (true) {
      try {
        // Component logic that might throw
        const data = riskyOperation();
        yield <>Data: {data}</>;
      } catch (error) {
        // Recover from error and continue running
        yield <>Error occurred: {error.message}</>;
      }
    }
  } finally {
    // Cleanup when component unmounts
    console.log('Component cleanup');
  }
}
```

### State Management

State in Ajo is simply local variables within generator components. The area before the main `while` loop acts as persistent storage for state, handlers, and utility functions, while the `while` loop body re-executes on each render:

```javascript
function* TodoList() {

  // Persistent state and handlers (defined once, persist between renders)
  let todos = [];
  let newTodo = '';

  const addTodo = () => {
    if (newTodo.trim()) {
      this.next(() => {
        todos.push({ id: Date.now(), text: newTodo, completed: false });
        newTodo = '';
      });
    }
  };

  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      this.next(() => todo.completed = !todo.completed);
    }
  };

  // Main render loop (re-executes on each render, like a React component function)
  while (true) {

    // Derived values calculated fresh on each render
    const completedCount = todos.filter(t => t.completed).length;
    const pendingCount = todos.length - completedCount;
    const allCompleted = todos.length > 0 && completedCount === todos.length;

    yield (
      <>
        <div class="stats">
          <span>Total: {todos.length}</span>
          <span>Pending: {pendingCount}</span>
          <span>Completed: {completedCount}</span>
        </div>

        <input 
          value={newTodo}
          set:oninput={(e) => { newTodo = e.target.value; }}
        />
        <button set:onclick={addTodo}>Add</button>

        {allCompleted && <p class="celebration">🎉 All tasks completed!</p>}

        <ul>
          {todos.map(todo => (
            <li key={todo.id} class={todo.completed ? 'completed' : ''}>
              <input 
                type="checkbox" 
                checked={todo.completed}
                set:onchange={() => toggleTodo(todo.id)}
              />
              {todo.text}
            </li>
          ))}
        </ul>
      </>
    );
  }
}
```

### Derived Values and Computations

Think of the main `while` loop body as equivalent to a React component function - it re-executes on every render, making it the perfect place for derived values.

```javascript
function* ShoppingCart(args) {

  // Persistent state
  let items = [];
  
  // Persistent handlers and utilities
  const addItem = (product) => this.next(() => {
    items.push({ ...product, quantity: 1, id: Date.now() });
  });

  const updateQuantity = (id, quantity) => this.next(() => {
    const item = items.find(i => i.id === id);
    if (item) item.quantity = Math.max(0, quantity);
    items = items.filter(i => i.quantity > 0);
  });

  // Main render loop
  while (true) {

    // Simple derived values computed fresh each render
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * args.discountRate;
    const tax = (subtotal - discount) * 0.1;
    const total = subtotal - discount + tax;
    
    // Conditional derived values
    const qualifiesForFreeShipping = subtotal > 50;
    const savings = discount > 0 ? `You saved $${discount.toFixed(2)}!` : null;

    yield (
      <>
        <h2>Cart ({itemCount} items)</h2>
        
        {items.map(item => (
          <div key={item.id} class="cart-item">
            <span>{item.name}</span>
            <input 
              type="number" 
              value={item.quantity}
              set:onchange={(e) => updateQuantity(item.id, +e.target.value)}
            />
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        
        <div class="cart-summary">
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          {discount > 0 && <div class="discount">Discount: -${discount.toFixed(2)}</div>}
          <div>Tax: ${tax.toFixed(2)}</div>
          <div class="total">Total: ${total.toFixed(2)}</div>
          
          {savings && <div class="savings">{savings}</div>}
          {qualifiesForFreeShipping && <div class="shipping">🚚 Free shipping!</div>}
        </div>
      </>
    );
  }
}
```

### Event Handling

Use the `set:` prefix to attach event handlers:

```javascript
function* EventExample() {

  let inputValue = '';
  let clickCount = 0;

  while (true) {
    yield (
      <>
        <input 
          value={inputValue}
          set:oninput={e => this.next(() => inputValue = e.target.value)}
        />
        <button 
          set:onclick={() => this.next(() => clickCount++)}
        >
          Clicked {clickCount} times
        </button>
      </>
    );
  }
}
```

### Next Callback

The `this.next()` method accepts an optional callback function that receives the component's current props as its first parameter. This is useful for accessing updated props during state updates:

```javascript
function* ComponentWithProps(args) {

  let count = 0;

  const increment = () => this.next(({ multiplier, name }) => {
    count += multiplier;
    console.log(`Updated count for ${name}`);
  });

  const reset = () => this.next(({ name }) => {
    count = 0;
    console.log(`Reset ${name}`);
  });

  while (true) yield (
    <>
      <h3>{args.name}</h3>
      <p>Count: {count}</p>
      <button set:onclick={increment}>+{args.multiplier}</button>
      <button set:onclick={reset}>Reset</button>
    </>
  );
}
```

### Context API

The Context API provides a way to share data across component trees without prop drilling:

```javascript
import { context } from 'ajo/context';

// Create contexts with default values
const ThemeContext = context('light');
const UserContext = context(null);

// Provider component
function* App() {

  while (true) {

    ThemeContext('dark');
    UserContext({ name: 'John', role: 'admin' });

    yield (
      <div>
        <Header />
        <Content />
      </div>
    );
  }
}

// Consumer components
const Header = () => {
  const theme = ThemeContext();
  return <header class={`theme-${theme}`}>My App</header>;
};

function* UserProfile() {

  while (true) {

    const user = UserContext();
    const theme = ThemeContext();

    yield (
      <div class={`profile theme-${theme}`}>
        {user ? `Welcome, ${user.name}!` : 'Please login'}
      </div>
    );
  }
}
```

### Async Operations

Handle asynchronous data loading in components:

```javascript
function* AsyncData(args) {

  let data = null;
  let loading = true;
  let error = null;

  // Start async operation
  fetch(args.url)
    .then(response => response.json())
    .then(result => {
      this.next(() => {
        data = result;
        loading = false;
      });
    })
    .catch(err => {
      this.next(() => {
        error = err;
        loading = false;
      });
    });

  while (true) {
    if (loading) {
      yield <>Loading...</>;
    } else if (error) {
      yield <>Error: {error.message}</>;
    } else {
      yield <>Data: {JSON.stringify(data)}</>;
    }
  }
}
```

## Special Attributes

Ajo provides several special attributes for enhanced functionality:

### `key` - List Reconciliation

Use `key` for efficient list updates:

```javascript
function* TodoList() {

  let todos = [
    { id: 1, text: 'Buy milk', done: false },
    { id: 2, text: 'Walk dog', done: true }
  ];

  while (true) yield (
    <ul>
      {todos.map(todo => (
        <li key={todo.id} class={todo.done ? 'completed' : ''}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

### `ref` - DOM Access

Get direct access to DOM elements or component instances:

```javascript
function* FocusInput() {

  let inputRef = null;

  const focusInput = () => {
    inputRef?.focus();
  };

  while (true) {
    yield (
      <div>
        <input ref={el => inputRef = el} />
        <button set:onclick={focusInput}>Focus Input</button>
      </div>
    );
  }
}
```

### `memo` - Performance Optimization

Prevent unnecessary re-renders of DOM subtrees using the `memo` attribute:

```javascript
function* ExpensiveList(args) {
  while (true) {
    yield (
      <>
        <p>Filter: {args.filter}</p>
        {/* Only re-render when items change, not filter */}
        <div memo={[args.items]}>
          {args.items.map(item => (
            <ExpensiveItem key={item.id} item={item} />
          ))}
        </div>
      </>
    );
  }
}
```

### `skip` - Third-Party DOM Management

Skip Ajo's DOM reconciliation for elements managed by third-party libraries:

```javascript
function* ChartComponent(args) {

  let chartRef = null;
  let chartInstance = null;

  while (true) {
    yield (
      <div 
        ref={el => {
          if (el && !chartInstance) {
            chartRef = el;
            // Third-party library manages this DOM
            chartInstance = new ThirdPartyChart(el, args.data);
          }
        }}
        skip
      >
        {/* Ajo won't touch children - third-party library controls this */}
        <canvas id="chart-canvas"></canvas>
        <div class="chart-legend"></div>
      </div>
    );
  }
}
```

### `set:` - Property Setting

Set DOM properties directly (not attributes):

```javascript
const Interactive = () => (
  <button
    set:onclick={() => alert('Clicked!')}
    set:disabled={false}
  >
    Click me!
  </button>
);
```

### `attr:` - Attribute Forcing

Force values to be set as HTML attributes on stateful component wrappers:

```javascript
function* CustomComponent() {
  while (true) {
    yield <>Custom Content</>;
  }
}

// Usage with forced attributes
const App = () => (
  <CustomComponent 
    attr:id="custom-id"
    attr:class="custom-class"
    attr:data-test="test-value"
  />
);
// Renders: <div id="custom-id" class="custom-class" data-test="test-value">...</div>
```

## Advanced Patterns

### Error Boundaries

Handle errors in component trees with proper error recovery:

```javascript
function* ErrorBoundary(args) {
  while (true) {
    try {
      yield args.children;
    } catch (error) {
      // Error recovery - user can try again and succeed
      yield (
        <>
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button set:onclick={() => this.next()}>Try Again</button>
        </>
      );
    }
  }
}
```

For cleanup on component unmount, use `try...finally`:

```javascript
function* ComponentWithCleanup() {

  console.log('Component mounted');
  
  try {
    while (true) {
      yield <>Component content</>;
    }
  } finally {
    console.log('Component unmounted - cleanup here');
    // Cleanup resources, cancel timers, etc.
  }
}
```

### Higher-Order Components

Create reusable component logic:

```javascript
const withLoading = (Component) => {
  return function* LoadingWrapper(args) {
    while (true) {
      if (args.loading) {
        yield <>Loading...</>;
      } else {
        yield <Component {...args} />;
      }
    }
  };
};

// Usage
const EnhancedComponent = withLoading(MyComponent);
```

## Server-Side Rendering

Ajo provides comprehensive SSR capabilities with both static and streaming rendering options.

### Static SSR

For static page generation:

```javascript
import { render } from 'ajo/html';

const HomePage = ({ title, content }) => (
  <html>
    <head>
      <title>{title}</title>
    </head>
    <body>
      <h1>{title}</h1>
      <p>{content}</p>
    </body>
  </html>
);

const html = render(<HomePage title="Welcome" content="Hello, world!" />);

console.log(html); // Full HTML string
```

### Streaming SSR

For progressive page loading:

```javascript
import { stream } from 'ajo/stream';
import http from 'node:http';

// Async data component
async function UserProfile({ userId }) {
  const user = await fetch(`/api/users/${userId}`).then(r => r.json());
  return (
    <div class="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// Page component with fallback
const ProfilePage = ({ userId }) => (
  <html>
    <head>
      <title>User Profile</title>
      <script src="/hydrate.js"></script>
    </head>
    <body>
      <header>
        <h1>My App</h1>
      </header>
      <main>
        <UserProfile 
          userId={userId} 
          fallback={<div>Loading user...</div>}
        />
      </main>
    </body>
  </html>
);

// Server setup
const server = http.createServer(async (req, res) => {

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  const userId = new URL(req.url, 'http://localhost').searchParams.get('id');
  
  for await (const chunk of stream(<ProfilePage userId={userId} />)) {
    res.write(chunk);
  }
  
  res.end();
});

server.listen(3000);
```

### Hydration

Client-side hydration script:

```javascript
// hydrate.js
import { hydrate } from 'ajo/stream';

// Set up streaming hydration
window.$stream = {
  push: hydrate
};

// Hydrate any buffered patches
if (window.$stream?.buffer) {
  window.$stream.buffer.forEach(hydrate);
  delete window.$stream.buffer;
}
```

### Islands Architecture

Create interactive islands within static content:

```javascript
// Island component (client-only)
function* InteractiveCounter() {

  let count = 0;
  
  const increment = () => {
    this.next(() => count++);
  };
  
  while (true) {
    yield (
      <button set:onclick={increment} class="interactive">
        Clicks: {count}
      </button>
    );
  }
}

// Static page with island
const LandingPage = () => (
  <html>
    <body>
      <header>
        <h1>Welcome to Our Site</h1>
      </header>
      
      <main>
        <p>This content is static and loads instantly.</p>
        
        {/* This will hydrate on the client */}
        <InteractiveCounter src="/islands/counter.js" />
        
        <p>More static content...</p>
      </main>
    </body>
  </html>
);
```

### Async Generator Components

For progressive enhancement:

```javascript
async function* ProgressiveContent() {

  // Initial loading state
  yield <>Loading articles...</>;
  
  // Load and show first batch
  const firstBatch = await loadArticles(0, 10);
  yield (
    <div>
      <h2>Latest Articles</h2>
      {firstBatch.map(article => <ArticleCard key={article.id} article={article} />)}
      <div>Loading more...</div>
    </div>
  );
  
  // Load and show complete content
  const allArticles = await loadArticles(0, 50);
  return (
    <div>
      <h2>Latest Articles</h2>
      {allArticles.map(article => <ArticleCard key={article.id} article={article} />)}
      <button>Load More</button>
    </div>
  );
}
```

## TypeScript Support

Ajo provides comprehensive TypeScript support for enhanced developer experience:

### Component Types

```typescript
import type { Stateful, Stateless, Children } from 'ajo';

// Stateless component with typed props
type ButtonProps = {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  children: Children;
  onClick: () => void;
};

const Button: Stateless<ButtonProps> = ({ variant, disabled, children, onClick }) => (
  <button 
    class={`btn btn-${variant}`}
    disabled={disabled}
    set:onclick={onClick}
  >
    {children}
  </button>
);

// Stateful component with typed props and wrapper element
type CounterProps = {
  initialValue: number;
  step?: number;
};

const Counter: Stateful<CounterProps, 'section'> = function* (args) {
  let count = args.initialValue;

  const increment = () => {
    this.next(({ step = 1 }) => count += step);
  };

  while (true) {
    yield (
      <>
        <span>Count: {count}</span>
        <button set:onclick={increment}>+{args.step ?? 1}</button>
      </>
    );
  }
};

// Specify wrapper element
Counter.is = 'section';
```

### Context Types

```typescript
import { context } from 'ajo/context';

type Theme = 'light' | 'dark';
type User = { id: string; name: string; email: string } | null;

const ThemeContext = context<Theme>('light');
const UserContext = context<User>(null);

// Typed usage
function* ThemedUserProfile() {
  while (true) {
    const theme: Theme = ThemeContext();
    const user: User = UserContext();
    
    yield (
      <div class={`profile theme-${theme}`}>
        {user ? `Welcome, ${user.name}!` : 'Please login'}
      </div>
    );
  }
}
```

### Generic Components

```typescript
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => Children;
  keyExtractor: (item: T) => string | number;
};

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Usage
const TodoList = () => (
  <List
    items={todos}
    keyExtractor={todo => todo.id}
    renderItem={todo => <span>{todo.text}</span>}
  />
);
```

### Element Types and Refs

```typescript
function* InputWithFocus() {
  let inputRef: HTMLInputElement | null = null;
  
  const focusInput = () => {
    inputRef?.focus();
  };
  
  while (true) {
    yield (
      <>
        <input 
          ref={(el: HTMLInputElement | null) => inputRef = el}
          type="text"
        />
        <button set:onclick={focusInput}>Focus</button>
      </>
    );
  }
}
```

## Best Practices

### Component Design

1. **Keep components focused**: Each component should have a single responsibility
2. **Use stateless components for presentation**: Reserve stateful components for state management
3. **Use fragments in stateful components**: Since stateful components automatically wrap content in a wrapper element, use fragments (`<>...</>`) to avoid unnecessary nested DOM nodes
4. **Handle stateful component props correctly**: Avoid destructuring props in the function signature as it locks values to initial props. Use the `args` parameter directly or destructure inside the render loop
5. **Leverage context for shared state**: Avoid prop drilling with the Context API
6. **Implement proper error boundaries**: Handle errors gracefully in your component tree

#### Stateful Component Props Best Practices

```javascript
// ❌ DON'T: Destructuring in function signature locks values
function* Counter({ step, initialValue }) {
  let count = initialValue; // Won't update if initialValue prop changes
  // step will always be the initial value, never updated
}

// ✅ PREFERRED: Use args parameter directly
function* Counter(args) {
  let count = args.initialValue;
  
  while (true) {
    yield <>+{args.step}</>; // Always current value
  }
}

// ✅ ALTERNATIVE: Destructure inside the while loop for latest values
function* Counter(args) {
  let count = args.initialValue;
  
  while (true) {
    const { step, label } = args; // Fresh destructuring on each render
    yield <>{label}: +{step}</>;
  }
}
```

### Performance

1. **Use `memo` attribute for expensive renders**: Wrap expensive DOM subtrees with the memo attribute
2. **Optimize list rendering**: Always provide `key` attributes for list items
3. **Minimize re-renders**: Only update state when necessary  
4. **Use `skip` for third-party DOM**: Let external libraries manage their own DOM without Ajo interference

### Code Organization

1. **Separate concerns**: Keep components, styles, and logic in appropriate files
2. **Create reusable utilities**: Extract common patterns into utility functions and modules
3. **Use TypeScript**: Leverage types for better developer experience
4. **Write tests**: Test component behavior and state management

### Deployment

1. **Use SSR for better SEO**: Leverage server-side rendering for public-facing sites
2. **Implement streaming**: Use streaming SSR for better perceived performance
3. **Optimize bundles**: Use build tools to minimize client-side JavaScript
4. **Monitor performance**: Track rendering performance and optimization opportunities

## Conclusion

Ajo provides a modern, efficient approach to building user interfaces with its unique generator-based architecture. By leveraging native JavaScript features and providing powerful abstractions for common patterns, Ajo enables developers to build high-performance web applications with minimal complexity.

The library's emphasis on simplicity, performance, and developer experience makes it an excellent choice for projects ranging from static sites to complex interactive applications. With comprehensive TypeScript support, advanced SSR capabilities, and a growing ecosystem, Ajo is well-positioned to meet the demands of modern web development.

For more information, examples, and community resources, visit the [Ajo GitHub repository](https://github.com/cristianfalcone/ajo).
