# 🚀 Quick Start Guide - New Features

## Toast Notifications

### Basic Usage
```javascript
import { useToast } from '../components/Toast';

function MyComponent() {
  const { addToast } = useToast();
  
  const handleAction = () => {
    // Success notification
    addToast('Action completed!', 'success');
    
    // Error notification
    addToast('Something went wrong', 'error');
    
    // Warning notification
    addToast('Please check your input', 'warning');
    
    // Info notification
    addToast('FYI: New update available', 'info');
  };
}
```

---

## Confirmation Dialogs

### Basic Usage
```javascript
import ConfirmDialog from '../components/ConfirmDialog';

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Delete Item
      </button>
      
      {showConfirm && (
        <ConfirmDialog
          title="Confirm Deletion"
          message="Are you sure you want to delete this item?"
          type="danger"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => {
            // Handle deletion
            setShowConfirm(false);
          }}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
```

---

## Export Utilities

### Export to CSV
```javascript
import { exportToCSV } from '../utils/exportUtils';

const exportData = () => {
  const data = [
    { Name: 'John Doe', Email: 'john@example.com', Amount: 1000 },
    { Name: 'Jane Smith', Email: 'jane@example.com', Amount: 2000 }
  ];
  
  exportToCSV(data, 'my-export');
};
```

### Export Table to CSV
```javascript
import { exportTableToCSV } from '../utils/exportUtils';

const exportTable = () => {
  // Exports the first table element on the page
  exportTableToCSV('my-export');
};
```

---

## Advanced Search

### Basic Usage
```javascript
import AdvancedSearch from '../components/AdvancedSearch';

function MyComponent() {
  const filters = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'date'
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter email...'
    }
  ];
  
  const handleSearch = (query, filters) => {
    console.log('Search query:', query);
    console.log('Active filters:', filters);
    // Perform search
  };
  
  return (
    <AdvancedSearch
      placeholder="Search tenants..."
      filters={filters}
      onSearch={handleSearch}
      suggestions={['Recent search 1', 'Recent search 2']}
    />
  );
}
```

---

## Bulk Actions

### Basic Usage
```javascript
import BulkActions from '../components/BulkActions';

function MyComponent() {
  const [selectedItems, setSelectedItems] = useState([]);
  
  const actions = [
    {
      label: 'Delete Selected',
      onClick: () => handleBulkDelete(),
      icon: '🗑️'
    },
    {
      label: 'Export Selected',
      onClick: () => handleBulkExport(),
      icon: '📥'
    }
  ];
  
  return (
    <BulkActions
      selectedItems={selectedItems}
      totalItems={100}
      onSelectAll={() => setSelectedItems(allItemIds)}
      onDeselectAll={() => setSelectedItems([])}
      actions={actions}
    />
  );
}
```

---

## Date Range Picker

### Basic Usage
```javascript
import DateRangePicker from '../components/DateRangePicker';

function MyComponent() {
  const handleDateRange = (range) => {
    console.log('Start:', range.startDate);
    console.log('End:', range.endDate);
    // Filter data by date range
  };
  
  const handleClear = () => {
    // Clear date filter
  };
  
  return (
    <DateRangePicker
      onApply={handleDateRange}
      onClear={handleClear}
    />
  );
}
```

---

## Form Validation

### Basic Usage
```javascript
import { useFormValidation, FormField } from '../hooks/useFormValidation';

function MyForm() {
  const initialValues = {
    name: '',
    email: '',
    phone: '',
    age: ''
  };
  
  const validationSchema = {
    name: [
      { validator: 'required', message: 'Name is required' }
    ],
    email: [
      { validator: 'required' },
      { validator: 'email' }
    ],
    phone: [
      { validator: 'required' },
      { validator: 'phone' }
    ],
    age: [
      { validator: 'required' },
      { validator: 'numeric' },
      { validator: 'min', params: 18, message: 'Must be at least 18' }
    ]
  };
  
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting
  } = useFormValidation(initialValues, validationSchema);
  
  const onSubmit = async (values) => {
    // Handle form submission
    console.log('Form values:', values);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Name"
        name="name"
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
        touched={touched.name}
        required
      />
      
      <FormField
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        touched={touched.email}
        required
      />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## Loading Skeletons

### Basic Usage
```javascript
import { 
  TableSkeleton, 
  CardSkeleton, 
  PageSkeleton 
} from '../components/LoadingSkeleton';

function MyComponent() {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <PageSkeleton />;
  }
  
  return (
    <div>
      {/* Your content */}
    </div>
  );
}

// Or use specific skeletons
function MyTable() {
  if (loading) {
    return (
      <table>
        <thead>{/* headers */}</thead>
        <TableSkeleton rows={5} columns={7} />
      </table>
    );
  }
  
  return <table>{/* actual data */}</table>;
}
```

---

## Error Boundary

### Wrap Components
```javascript
import ErrorBoundary from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallbackMessage="Something went wrong in the dashboard">
      <Dashboard />
    </ErrorBoundary>
  );
}
```

### Using HOC
```javascript
import { withErrorBoundary } from '../components/ErrorBoundary';

const MyComponent = () => {
  // Component code
};

export default withErrorBoundary(MyComponent, 'Custom error message');
```

---

## Responsive Design Classes

### Utility Classes Available

#### Display
```html
<div class="flex">Flexbox container</div>
<div class="grid-2">2 column grid</div>
<div class="grid-3">3 column grid</div>
```

#### Spacing
```html
<div class="gap-1">Gap 1rem</div>
<div class="gap-2">Gap 2rem</div>
<div class="m-1">Margin 1rem</div>
<div class="p-2">Padding 2rem</div>
```

#### Text
```html
<span class="text-center">Centered</span>
<span class="text-bold">Bold</span>
<span class="text-lg">Large</span>
```

#### Alignment
```html
<div class="flex items-center">Vertically centered</div>
<div class="flex justify-between">Space between</div>
```

#### Animations
```html
<div class="fade-in">Fade in animation</div>
<div class="slide-in-up">Slide up animation</div>
```

---

## Badge System

### Usage
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-danger">Inactive</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-info">Info</span>
```

---

## Empty States

### Usage
```html
<div class="empty-state">
  <div class="empty-icon">🏠</div>
  <h3>No Items Found</h3>
  <p>Get started by adding your first item.</p>
  <button class="btn btn-primary">Add Item</button>
</div>
```

---

## Stat Cards

### Usage
```html
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
      📊
    </div>
    <div class="stat-content">
      <div class="stat-label">Total Items</div>
      <div class="stat-value">150</div>
      <div class="stat-badge">+12 this month</div>
    </div>
  </div>
</div>
```

---

## Charts with Recharts

### Bar Chart
```javascript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
];

<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="value" fill="#8884d8" />
</BarChart>
```

### Pie Chart
```javascript
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
];

const COLORS = ['#0088FE', '#00C49F'];

<PieChart>
  <Pie
    data={data}
    cx="50%"
    cy="50%"
    outerRadius={80}
    fill="#8884d8"
    dataKey="value"
  >
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

---

## Tips & Best Practices

### Toast Notifications
- ✅ Use success for completed actions
- ✅ Use error for failures
- ✅ Use warning for potentially problematic situations
- ✅ Use info for neutral information
- ✅ Keep messages short and clear

### Confirmation Dialogs
- ✅ Always use for destructive actions
- ✅ Be specific in the message
- ✅ Use danger type for deletions
- ✅ Use warning type for potentially problematic actions

### Form Validation
- ✅ Validate on blur for better UX
- ✅ Show errors only after field is touched
- ✅ Provide clear, helpful error messages
- ✅ Disable submit while submitting

### Bulk Operations
- ✅ Always show selected count
- ✅ Provide select all/deselect all
- ✅ Confirm before performing bulk actions
- ✅ Show progress for long operations

### Loading States
- ✅ Use skeletons for better perceived performance
- ✅ Match skeleton layout to actual content
- ✅ Keep loading states minimal

---

**Happy Coding! 🚀**
