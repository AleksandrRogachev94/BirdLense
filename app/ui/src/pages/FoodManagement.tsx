import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import { Edit, Plus, Trash } from 'lucide-react';
import { FoodItem } from '../types';

const mockFoodItems: FoodItem[] = [
  {
    id: '1',
    name: 'Black Oil Sunflower Seeds',
    type: 'seed',
    quantity: 1000,
    unit: 'g',
    lastRefillDate: '2024-03-10T08:30:00Z',
    preferredBy: ['Northern Cardinal', 'Blue Jay', 'American Goldfinch'],
  },
  {
    id: '2',
    name: 'Suet Cake',
    type: 'suet',
    quantity: 500,
    unit: 'g',
    lastRefillDate: '2024-03-09T14:20:00Z',
    preferredBy: ['Woodpecker', 'Chickadee'],
  },
];

export function FoodManagement() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>(mockFoodItems);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  const handleOpen = (item?: FoodItem) => {
    setSelectedItem(item || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  const handleSave = (item: FoodItem) => {
    if (selectedItem) {
      setFoodItems((items) => items.map((i) => (i.id === item.id ? item : i)));
    } else {
      setFoodItems((items) => [
        ...items,
        { ...item, id: Date.now().toString() },
      ]);
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    setFoodItems((items) => items.filter((item) => item.id !== id));
  };

  return (
    <Container maxWidth="lg">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" component="h1">
          Food Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus />}
          onClick={() => handleOpen()}
        >
          Add Food Item
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Last Refill</TableCell>
              <TableCell>Preferred By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {foodItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Chip label={item.type} color="primary" size="small" />
                </TableCell>
                <TableCell>
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell>
                  {new Date(item.lastRefillDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {item.preferredBy.map((bird) => (
                      <Chip key={bird} label={bird} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(item)} size="small">
                    <Edit className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(item.id)}
                    size="small"
                    color="error"
                  >
                    <Trash className="w-4 h-4" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <FoodItemDialog
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        item={selectedItem}
      />
    </Container>
  );
}

interface FoodItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: FoodItem) => void;
  item: FoodItem | null;
}

function FoodItemDialog({ open, onClose, onSave, item }: FoodItemDialogProps) {
  const [formData, setFormData] = useState<Partial<FoodItem>>(
    item || {
      name: '',
      type: 'seed',
      quantity: 0,
      unit: 'g',
      preferredBy: [],
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: item?.id || Date.now().toString(),
      lastRefillDate: new Date().toISOString(),
    } as FoodItem);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{item ? 'Edit Food Item' : 'Add Food Item'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as FoodItem['type'],
                  })
                }
                label="Type"
              >
                <MenuItem value="seed">Seed</MenuItem>
                <MenuItem value="suet">Suet</MenuItem>
                <MenuItem value="nectar">Nectar</MenuItem>
                <MenuItem value="fruit">Fruit</MenuItem>
                <MenuItem value="insect">Insect</MenuItem>
              </Select>
            </FormControl>

            <Box display="flex" gap={2}>
              <TextField
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
                required
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit: e.target.value as FoodItem['unit'],
                    })
                  }
                  label="Unit"
                >
                  <MenuItem value="g">Grams</MenuItem>
                  <MenuItem value="ml">Milliliters</MenuItem>
                  <MenuItem value="pieces">Pieces</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
