
# API Integration Documentation

## Supabase Client Configuration

### **Client Setup**
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gynvafivzdtdqojuuoit.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

### **Type-Safe Database Access**
```typescript
// All database operations use generated types
import { Database } from '@/integrations/supabase/types';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type EquipmentInsert = Database['public']['Tables']['equipment']['Insert'];
type EquipmentUpdate = Database['public']['Tables']['equipment']['Update'];
```

## Data Access Patterns

### **Equipment Management**
```typescript
// src/hooks/useEquipment.ts
export const useEquipment = () => {
  // Fetch all equipment with relationships
  const fetchEquipment = async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        location:locations(name, abbreviation),
        room:rooms(name, floor_number),
        equipment_type:equipment_types(name, description)
      `)
      .order('name');
    
    if (error) throw error;
    return data;
  };

  // Create new equipment
  const createEquipment = async (equipmentData: EquipmentInsert) => {
    const { data, error } = await supabase
      .from('equipment')
      .insert(equipmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  // Update equipment with optimistic updates
  const updateEquipment = async (id: string, updates: EquipmentUpdate) => {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };
};
```

### **Location Management**
```typescript
// src/hooks/useLocations.ts
export const useLocations = () => {
  // Fetch locations with room and equipment counts
  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        rooms(count),
        equipment(count)
      `)
      .order('name');
    
    return data?.map(location => ({
      ...location,
      roomCount: location.rooms?.[0]?.count || 0,
      equipmentCount: location.equipment?.[0]?.count || 0
    }));
  };

  // Bulk location import with validation
  const importLocations = async (locations: LocationInsert[]) => {
    const results = [];
    const errors = [];

    for (const location of locations) {
      try {
        const { data, error } = await supabase
          .from('locations')
          .insert(location)
          .select()
          .single();
        
        if (error) throw error;
        results.push(data);
      } catch (error) {
        errors.push({ location, error: error.message });
      }
    }

    return { results, errors };
  };
};
```

### **Real-time Subscriptions**
```typescript
// Real-time equipment updates
useEffect(() => {
  const subscription = supabase
    .channel('equipment-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'equipment' },
      (payload) => {
        console.log('Equipment change:', payload);
        // Update local state
        queryClient.invalidateQueries({ queryKey: ['equipment'] });
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

## Permission System Integration

### **User Permissions Query**
```typescript
// Get effective user permissions
const getUserPermissions = async (userId: string, role: UserRole) => {
  const { data, error } = await supabase
    .rpc('get_user_permissions', {
      target_user_id: userId,
      user_role: role
    });
  
  if (error) throw error;
  return data;
};

// Initialize permissions for new user
const initializeUserPermissions = async (userId: string, role: UserRole) => {
  const { error } = await supabase
    .rpc('initialize_user_permissions', {
      target_user_id: userId,
      user_role: role
    });
  
  if (error) throw error;
};
```

### **Location Access Control**
```typescript
// Check user access to specific location
const checkLocationAccess = async (userId: string, locationId: string) => {
  const { data, error } = await supabase
    .from('user_location_access')
    .select('access_level')
    .eq('user_id', userId)
    .eq('location_id', locationId)
    .single();
  
  return data?.access_level || null;
};

// Grant location access
const grantLocationAccess = async (
  userId: string, 
  locationId: string, 
  accessLevel: 'read' | 'write' | 'admin'
) => {
  const { data, error } = await supabase
    .from('user_location_access')
    .insert({
      user_id: userId,
      location_id: locationId,
      access_level: accessLevel
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

## CSV Import System

### **Intelligent Column Mapping**
```typescript
// Generic CSV import with column mapping
export const importCSVData = async <T>(
  csvData: any[],
  tableName: string,
  columnMapping: Record<string, string[]>,
  validation?: (row: any) => boolean
) => {
  const results = [];
  const errors = [];

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const mappedData: Partial<T> = {};

    // Intelligent column mapping
    Object.entries(columnMapping).forEach(([targetField, possibleColumns]) => {
      for (const columnName of possibleColumns) {
        if (row[columnName] !== undefined) {
          mappedData[targetField] = row[columnName];
          break;
        }
      }
    });

    // Validate mapped data
    if (validation && !validation(mappedData)) {
      errors.push(`Row ${i + 2}: Validation failed`);
      continue;
    }

    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(mappedData)
        .select()
        .single();
      
      if (error) throw error;
      results.push(data);
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error.message}`);
    }
  }

  return { results, errors };
};
```

### **Location Import Example**
```typescript
// Location-specific import with enhanced mapping
const locationColumnMapping = {
  name: [
    'name', 'Name', 'NAME',
    'Location Name', 'location name', 'LOCATION NAME',
    'Store Name', 'store name', 'STORE NAME',
    'Business Name', 'business name', 'BUSINESS NAME'
  ],
  abbreviation: [
    'abbreviation', 'Abbreviation', 'ABBREVIATION',
    'Location Code', 'location code', 'LOCATION CODE',
    'Store Code', 'store code', 'STORE CODE',
    'code', 'Code', 'CODE'
  ],
  address: [
    'address', 'Address', 'ADDRESS',
    'Street Address', 'street address', 'STREET ADDRESS',
    'Full Address', 'full address', 'FULL ADDRESS'
  ]
};
```

## Error Handling Patterns

### **Standardized Error Handling**
```typescript
// Generic error handler for database operations
const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error during ${operation}:`, error);
  
  // Handle specific error types
  if (error.code === '23505') {
    throw new Error('This record already exists');
  }
  
  if (error.code === '23503') {
    throw new Error('Referenced record not found');
  }
  
  if (error.code === 'PGRST116') {
    throw new Error('No data found');
  }
  
  // Generic error
  throw new Error(error.message || `Failed to ${operation}`);
};

// Usage in hooks
const createEquipment = async (data: EquipmentInsert) => {
  try {
    const { data: result, error } = await supabase
      .from('equipment')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  } catch (error) {
    handleDatabaseError(error, 'create equipment');
  }
};
```

### **React Query Integration**
```typescript
// Equipment queries with error handling
export const useEquipmentQuery = () => {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data;
      } catch (error) {
        handleDatabaseError(error, 'fetch equipment');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Equipment mutations with optimistic updates
export const useCreateEquipmentMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEquipment,
    onMutate: async (newEquipment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['equipment'] });
      
      // Snapshot previous value
      const previousEquipment = queryClient.getQueryData(['equipment']);
      
      // Optimistically update
      queryClient.setQueryData(['equipment'], (old: Equipment[]) => [
        ...old,
        { ...newEquipment, id: 'temp-id', created_at: new Date().toISOString() }
      ]);
      
      return { previousEquipment };
    },
    onError: (err, newEquipment, context) => {
      // Rollback on error
      queryClient.setQueryData(['equipment'], context?.previousEquipment);
    },
    onSettled: () => {
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};
```

## Authentication Integration

### **Auth State Management**
```typescript
// Auth context for user state
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};
```

### **Protected Route Pattern**
```typescript
// Route protection based on user permissions
const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user } = useAuth();
  const { permissions } = usePermissions();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }

  if (requiredPermission && !hasPermission(permissions, requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

This API integration provides type-safe, efficient, and error-resilient data access throughout the Operations Hub application.
