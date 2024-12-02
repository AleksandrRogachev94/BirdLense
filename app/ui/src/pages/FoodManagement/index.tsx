import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { fetchBirdFood, toggleBirdFood, addBirdFood } from '../../api/api';
import { BirdFood } from '../../types';

// BirdFoodManagement Component
export const FoodManagement = () => {
  const queryClient = useQueryClient();
  const [newFoodName, setNewFoodName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch food data
  const {
    data: foodData,
    isLoading,
    error,
  } = useQuery({ queryKey: ['birdFood'], queryFn: fetchBirdFood });

  // Mutation for toggling food status
  const toggleMutation = useMutation({
    mutationFn: toggleBirdFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birdFood'] });
    },
  });

  // Mutation for adding new food
  const addFoodMutation = useMutation({
    mutationFn: addBirdFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birdFood'] });
      setNewFoodName(''); // Reset input after success
      setErrorMessage('');
    },
    onError: () => {
      setErrorMessage('Failed to add bird food. Please try again.');
    },
  });

  const handleToggle = (id: number) => {
    toggleMutation.mutate(id);
  };

  const handleAddFood = () => {
    if (newFoodName.trim()) {
      addFoodMutation.mutate({ name: newFoodName });
    } else {
      setErrorMessage('Food name cannot be empty.');
    }
  };

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error fetching bird food data</div>;

  return (
    <Box>
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="h6">Add New Food</Typography>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 1 }}
        >
          <TextField
            label="Food Name"
            variant="outlined"
            size="small"
            value={newFoodName}
            onChange={(e) => setNewFoodName(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleAddFood}
            disabled={addFoodMutation.isPending}
          >
            Add
          </Button>
        </Box>
        {errorMessage && <Typography color="error">{errorMessage}</Typography>}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(foodData as BirdFood[]).map((food) => (
              <TableRow key={food.id}>
                <TableCell>{food.name}</TableCell>
                <TableCell align="center">
                  {food.active ? 'Yes' : 'No'}
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    color={food.active ? 'error' : 'primary'}
                    onClick={() => handleToggle(food.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {food.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
