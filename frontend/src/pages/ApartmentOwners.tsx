// IMPORTAÇÕES
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
} from '@mui/icons-material';
import { gql } from '@apollo/client';

// FORMATADOR DE DATA
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Not set';
  try {
    const date = new Date(dateString);
    const adjustedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
};

// GRAPHQL
const GET_APARTMENT_OWNERS = gql`
  query GetApartmentOwners {
    apartmentOwners {
      id
      name
      email
      apartmentNumber
      building {
        id
        name
      }
      phoneNumber
      createdAt
      updatedAt
    }
  }
`;

const GET_BUILDINGS = gql`
  query GetBuildings {
    buildings {
      id
      name
    }
  }
`;

const CREATE_APARTMENT_OWNER = gql`
  mutation CreateApartmentOwner($input: CreateApartmentOwnerInput!) {
    createApartmentOwner(input: $input) {
      id
      name
      email
      apartmentNumber
      phoneNumber
      createdAt
    }
  }
`;

const UPDATE_APARTMENT_OWNER = gql`
  mutation UpdateApartmentOwner($id: ID!, $input: UpdateApartmentOwnerInput!) {
    updateApartmentOwner(id: $id, input: $input) {
      id
      name
      email
      apartmentNumber
      phoneNumber
      updatedAt
    }
  }
`;

const DELETE_APARTMENT_OWNER = gql`
  mutation DeleteApartmentOwner($id: ID!) {
    deleteApartmentOwner(id: $id)
  }
`;

// TIPAGENS
interface Building {
  id: string;
  name: string;
}

interface ApartmentOwner {
  id: string;
  name: string;
  email: string;
  apartmentNumber: string;
  buildingId?: string;
  building?: Building;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApartmentOwnerFormData {
  name: string;
  email: string;
  apartmentNumber: string;
  buildingId: string;
  phoneNumber: string;
}

// COMPONENTE
const ApartmentOwners: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOwner, setEditingOwner] = useState<ApartmentOwner | null>(null);
  const [formData, setFormData] = useState<ApartmentOwnerFormData>({
    name: '',
    email: '',
    apartmentNumber: '',
    buildingId: '',
    phoneNumber: '',
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  const { loading, error, data, refetch } = useQuery(GET_APARTMENT_OWNERS);
  const { data: buildingsData } = useQuery(GET_BUILDINGS);
  const [createOwner] = useMutation(CREATE_APARTMENT_OWNER);
  const [updateOwner] = useMutation(UPDATE_APARTMENT_OWNER);
  const [deleteOwner] = useMutation(DELETE_APARTMENT_OWNER);

  const handleOpenDialog = (owner?: ApartmentOwner) => {
    if (owner) {
      setEditingOwner(owner);
      setFormData({
        name: owner.name,
        email: owner.email,
        apartmentNumber: owner.apartmentNumber,
        buildingId: owner.buildingId || '',
        phoneNumber: owner.phoneNumber || '',
      });
    } else {
      setEditingOwner(null);
      setFormData({
        name: '',
        email: '',
        apartmentNumber: '',
        buildingId: '',
        phoneNumber: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOwner(null);
    setFormData({
      name: '',
      email: '',
      apartmentNumber: '',
      buildingId: '',
      phoneNumber: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingOwner) {
        await updateOwner({ variables: { id: editingOwner.id, input: formData } });
      } else {
        await createOwner({ variables: { input: formData } });
      }
      refetch();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving apartment owner:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this apartment owner?')) {
      try {
        await deleteOwner({ variables: { id } });
        refetch();
      } catch (error) {
        console.error('Error deleting apartment owner:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading apartment owners: {error.message}</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Apartment Owners</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Owner
        </Button>
      </Box>

      {/* FILTRO POR PRÉDIO */}
      <FormControl fullWidth sx={{ maxWidth: 300, mb: 3 }}>
        <InputLabel>Filter by Building</InputLabel>
        <Select
          value={selectedBuildingId}
          label="Filter by Building"
          onChange={(e) => setSelectedBuildingId(e.target.value)}
        >
          <MenuItem value="">All Buildings</MenuItem>
          {buildingsData?.buildings.map((building: Building) => (
            <MenuItem key={building.id} value={building.id}>
              {building.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* LISTAGEM */}
      <Grid container spacing={3}>
        {data?.apartmentOwners
          .filter((owner: ApartmentOwner) =>
            selectedBuildingId ? owner.building?.id === selectedBuildingId : true
          )
          .map((owner: ApartmentOwner) => (
            <Grid item xs={12} sm={6} md={4} key={owner.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{owner.name}</Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="textSecondary">{owner.email}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <HomeIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="textSecondary">Apartment {owner.apartmentNumber}</Typography>
                  </Box>
                  {owner.building && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <ApartmentIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">{owner.building.name}</Typography>
                    </Box>
                  )}
                  {owner.phoneNumber && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">{owner.phoneNumber}</Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="textSecondary">
                    Created: {formatDate(owner.createdAt)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton size="small" onClick={() => handleOpenDialog(owner)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(owner.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
      </Grid>
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingOwner ? 'Edit Apartment Owner' : 'Add New Apartment Owner'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Apartment Number" value={formData.apartmentNumber} onChange={(e) => setFormData({ ...formData, apartmentNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Building</InputLabel>
                <Select value={formData.buildingId} label="Building" onChange={(e: SelectChangeEvent) => setFormData({ ...formData, buildingId: e.target.value })}>
                  <MenuItem value="">
                    <em>No building assigned</em>
                  </MenuItem>
                  {buildingsData?.buildings.map((building: Building) => (
                    <MenuItem key={building.id} value={building.id}>
                      {building.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Phone Number" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingOwner ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApartmentOwners;
