import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Paper,
  Box,
  CircularProgress,
} from '@mui/material';
import { fetchBirdFood, toggleBirdFood } from '../api/api';
import { BirdFood } from '../types';

// BirdFoodManagement Component
export const FoodManagement = () => {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['birdFood'] }); // Refresh the food list after updating
    },
  });

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error fetching bird food data</div>;

  return (
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
              <TableCell align="center">{food.active ? 'Yes' : 'No'}</TableCell>
              <TableCell align="center">
                <Button
                  variant="contained"
                  size="small"
                  color={food.active ? 'error' : 'primary'}
                  onClick={() => handleToggle(food.id)}
                >
                  {food.active ? 'Deactivate' : 'Activate'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
