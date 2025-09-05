import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import StatsBar from '../components/statsbar';

// Material-UI Components
import {
  Box, Stepper, Step, StepLabel, Button, Typography, TextField,
  Card, CardContent, Grid, Paper, Tabs, Tab, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, Divider, FormControl,
  InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Tooltip,
  CircularProgress, Alert, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TableSortLabel,
  Avatar, InputAdornment, Accordion, AccordionSummary, AccordionDetails,
  Input, InputBase, alpha, styled, AppBar, Toolbar, Badge
} from '@mui/material';

// Material-UI Icons
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CloudUpload as CloudUploadIcon,
  Star as StarIcon,
  Work as WorkIcon,
  Receipt as ReceiptIcon,
  SupportAgent as SupportAgentIcon,
  LocalAtm as LocalAtmIcon
} from '@mui/icons-material';

// Styled Components
const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '30ch',
      '&:focus': {
        width: '40ch',
      },
    },
  },
}));

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText('#2c3e50'),
  backgroundColor: '#2c3e50',
  '&:hover': {
    backgroundColor: '#1a252f',
  },
}));

// Main Component
const HotelManagementSystem = () => {
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('view');

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  }, []);

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#2c3e50' }}>
        <Toolbar>
          <HotelIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Hotel Management System
          </Typography>
          <SearchContainer>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search hotels..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </SearchContainer>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Snackbar 
          open={notification.show} 
          autoHideDuration={5000} 
          onClose={() => setNotification({ show: false, message: '', type: '' })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            severity={notification.type} 
            onClose={() => setNotification({ show: false, message: '', type: '' })}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
        
        <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'transparent' }}>
          <Typography variant="h4" component="h1" gutterBottom color="#2c3e50" fontWeight="600">
            Hotel Management Dashboard
          </Typography>
          <Typography variant="subtitle1" color="#7f8c8d">
            Manage hotel information, contacts, and facilities with ease
          </Typography>
        </Paper>
        
        <StatsBar />
        
        <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            centered
            sx={{ 
              '& .MuiTab-root': { 
                py: 2, 
                fontSize: '1rem',
                fontWeight: '500',
                minWidth: 150 
              } 
            }}
          >
            <Tab 
              value="add" 
              label={
                <Box display="flex" alignItems="center">
                  <AddIcon sx={{ mr: 1 }} />
                  Add Hotel
                </Box>
              } 
            />
            <Tab 
              value="view" 
              label={
                <Box display="flex" alignItems="center">
                  <BusinessIcon sx={{ mr: 1 }} />
                  View Hotels
                </Box>
              } 
            />
          </Tabs>
        </Paper>
        
        <Box>
          {activeTab === 'add' && <AddHotelTab showNotification={showNotification} />}
          {activeTab === 'view' && <HotelSalesList showNotification={showNotification} />}
        </Box>
      </Box>
    </Box>
  );
};

// Contact Person Component
const ContactPersonFields = ({ person, onChange, onRemove, index, role, phoneCode }) => (
  <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Name"
          value={person.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          required
          placeholder="Full name"
          variant="outlined"
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={person.email}
          onChange={(e) => onChange(index, 'email', e.target.value)}
          required
          placeholder="email@example.com"
          variant="outlined"
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          label="Contact"
          value={(person.contact || '').replace(phoneCode, '').trim()}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            onChange(index, 'contact', `${phoneCode} ${digits}`);
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start">{phoneCode}</InputAdornment>,
          }}
          placeholder="XXX XXX XXXX"
          required
          variant="outlined"
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={1}>
        <IconButton 
          color="error" 
          onClick={() => onRemove(index)}
          sx={{ mt: 1 }}
        >
          <RemoveIcon />
        </IconButton>
      </Grid>
    </Grid>
  </Paper>
);

// Contact Role Section
const ContactRoleSection = ({ title, role, persons, onAdd, onRemove, onChange, phoneCode, icon }) => (
  <Accordion defaultExpanded sx={{ mb: 2, borderRadius: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
        <Box display="flex" alignItems="center">
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>{title}</Typography>
        </Box>
        <Chip 
          label={`${persons.length} ${persons.length === 1 ? 'person' : 'persons'}`} 
          color="primary" 
          variant="outlined" 
          size="small"
        />
      </Box>
    </AccordionSummary>
    <AccordionDetails>
      {persons.map((person, index) => (
        <ContactPersonFields 
          key={index} 
          person={person} 
          onChange={(idx, field, value) => onChange(role, idx, field, value)} 
          onRemove={(idx) => onRemove(role, idx)}
          index={index}
          role={role}
          phoneCode={phoneCode}
        />
      ))}
      <Button 
        startIcon={<AddIcon />} 
        onClick={() => onAdd(role)}
        variant="outlined"
        sx={{ mt: 1 }}
      >
        Add {title}
      </Button>
    </AccordionDetails>
  </Accordion>
);

// Add Hotel Tab Component
const API_BASE = "https://hotels-8v0p.onrender.com/api";
const API_BASE_HOTEL = `${API_BASE}/hotels`;

const AddHotelTab = ({ showNotification, setActiveTab }) => {
  const steps = ['Location', 'Details', 'Contacts', 'Review'];
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());

  const [formData, setFormData] = useState({
    country: "", countryCode: "", countryId: null,
    city: "", cityId: null,
    hotelName: "", hotelEmail: "", hotelContactNumber: "", address: "", hotelChain: "",
    salesPersons: [{ name: "", email: "", contact: "" }],
    reservationPersons: [{ name: "", email: "", contact: "" }],
    accountsPersons: [{ name: "", email: "", contact: "" }],
    receptionPersons: [{ name: "", email: "", contact: "" }],
    concierges: [{ name: "", email: "", contact: "" }],
    specialRemarks: "", facilitiesAvailable: [], creditCategory: ""
  });

  const [countries, setCountries] = useState([]);
  const [citiesByCountry, setCitiesByCountry] = useState({});
  const [hotelsInCity, setHotelsInCity] = useState([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [hotelSearch, setHotelSearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hotelSource, setHotelSource] = useState(null);

  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const hotelDropdownRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState({ country: -1, city: -1, hotel: -1 });

  // Utility functions
  const getCurrentPhoneCode = () => {
    const country = countries.find(c => c.code === formData.countryCode);
    return country?.phoneCode || "+1";
  };

  const handleRemovePerson = (role, index) => {
    setFormData(prev => {
      const updatedRole = [...prev[role]];
      updatedRole.splice(index, 1);
      return { ...prev, [role]: updatedRole.length ? updatedRole : [{ name: "", email: "", contact: "" }] };
    });
  };

  const resetForm = () => {
    setFormData({
      country: "", countryCode: "", countryId: null,
      city: "", cityId: null,
      hotelName: "", hotelEmail: "", hotelContactNumber: "", address: "", hotelChain: "",
      salesPersons: [{ name: "", email: "", contact: "" }],
      reservationPersons: [{ name: "", email: "", contact: "" }],
      accountsPersons: [{ name: "", email: "", contact: "" }],
      receptionPersons: [{ name: "", email: "", contact: "" }],
      concierges: [{ name: "", email: "", contact: "" }],
      specialRemarks: "", facilitiesAvailable: [], creditCategory: ""
    });
    setCountrySearch("");
    setCitySearch("");
    setHotelSearch("");
    setValidationErrors({});
    setError("");
    setActiveStep(0);
  };

  // ... (other utility functions)

  const isStepOptional = (step) => {
    return step === 1;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit logic here
    showNotification("Hotel added successfully!", "success");
    resetForm();
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => {
            const stepProps = {};
            const labelProps = {};
            if (isStepSkipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        
        {activeStep === steps.length ? (
          <React.Fragment>
            <Typography sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
              Hotel added successfully!
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={resetForm}>Add Another Hotel</Button>
            </Box>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  backgroundColor: '#f8f9fa', 
                  p: 3, 
                  borderRadius: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography variant="h5" gutterBottom color="#2c3e50">
                    {activeStep === 0 && "Hotel Location"}
                    {activeStep === 1 && "Hotel Details"}
                    {activeStep === 2 && "Contact Information"}
                    {activeStep === 3 && "Review & Submit"}
                  </Typography>
                  <Typography variant="body2" color="#7f8c8d" paragraph>
                    {activeStep === 0 && "Provide the location details for the hotel. This helps in categorizing and organizing your hotel database efficiently."}
                    {activeStep === 1 && "Enter the basic details about the hotel. Accurate information ensures better management and communication."}
                    {activeStep === 2 && "Add contact persons for different departments. This facilitates smooth communication with the hotel."}
                    {activeStep === 3 && "Review all the information before submitting. You can go back to make changes if needed."}
                  </Typography>
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <CloudUploadIcon sx={{ fontSize: 60, color: '#2c3e50', opacity: 0.7 }} />
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Location Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Country</InputLabel>
                          <Select
                            value={formData.country}
                            label="Country"
                            onChange={(e) => {
                              const country = countries.find(c => c.name === e.target.value);
                              if (country) {
                                // handleCountrySelect(country.code, country.name, country.id);
                              }
                            }}
                          >
                            <MenuItem value="United States">United States</MenuItem>
                            <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                            <MenuItem value="Canada">Canada</MenuItem>
                            <MenuItem value="Australia">Australia</MenuItem>
                            <MenuItem value="Germany">Germany</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>City</InputLabel>
                          <Select
                            value={formData.city}
                            label="City"
                            onChange={(e) => {
                              // handleCitySelect logic
                            }}
                            disabled={!formData.country}
                          >
                            <MenuItem value="New York">New York</MenuItem>
                            <MenuItem value="Los Angeles">Los Angeles</MenuItem>
                            <MenuItem value="Chicago">Chicago</MenuItem>
                            <MenuItem value="London">London</MenuItem>
                            <MenuItem value="Toronto">Toronto</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                {activeStep === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Hotel Details
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          label="Hotel Name"
                          value={formData.hotelName}
                          onChange={(e) => setFormData({...formData, hotelName: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Contact Number"
                          value={formData.hotelContactNumber}
                          onChange={(e) => setFormData({...formData, hotelContactNumber: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={formData.hotelEmail}
                          onChange={(e) => setFormData({...formData, hotelEmail: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Hotel Chain"
                          value={formData.hotelChain}
                          onChange={(e) => setFormData({...formData, hotelChain: e.target.value})}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                {activeStep === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Contact Persons
                    </Typography>
                    
                    <ContactRoleSection
                      title="Sales Person"
                      role="salesPersons"
                      persons={formData.salesPersons}
                      onAdd={() => setFormData({ ...formData, salesPersons: [...formData.salesPersons, { name: "", email: "", contact: "" }] })}
                      onRemove={handleRemovePerson}
                      onChange={() => {}}
                      phoneCode={getCurrentPhoneCode()}
                      icon={<WorkIcon />}
                    />
                    
                    <ContactRoleSection
                      title="Reservation Person"
                      role="reservationPersons"
                      persons={formData.reservationPersons}
                      onAdd={() => setFormData({ ...formData, reservationPersons: [...formData.reservationPersons, { name: "", email: "", contact: "" }] })}
                      onRemove={handleRemovePerson}
                      onChange={() => {}}
                      phoneCode={getCurrentPhoneCode()}
                      icon={<ReceiptIcon />}
                    />
                    
                    <ContactRoleSection
                      title="Accounts Person"
                      role="accountsPersons"
                      persons={formData.accountsPersons}
                      onAdd={() => setFormData({ ...formData, accountsPersons: [...formData.accountsPersons, { name: "", email: "", contact: "" }] })}
                      onRemove={handleRemovePerson}
                      onChange={() => {}}
                      phoneCode={getCurrentPhoneCode()}
                      icon={<LocalAtmIcon />}
                    />
                    
                    <ContactRoleSection
                      title="Reception Person"
                      role="receptionPersons"
                      persons={formData.receptionPersons}
                      onAdd={() => setFormData({ ...formData, receptionPersons: [...formData.receptionPersons, { name: "", email: "", contact: "" }] })}
                      onRemove={handleRemovePerson}
                      onChange={() => {}}
                      phoneCode={getCurrentPhoneCode()}
                      icon={<SupportAgentIcon />}
                    />
                  </Box>
                )}
                
                {activeStep === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Review & Submit
                    </Typography>
                    
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Hotel Information
                        </Typography>
                        <Typography><strong>Name:</strong> {formData.hotelName}</Typography>
                        <Typography><strong>Address:</strong> {formData.address}</Typography>
                        <Typography><strong>City:</strong> {formData.city}</Typography>
                        <Typography><strong>Country:</strong> {formData.country}</Typography>
                        <Typography><strong>Contact:</strong> {formData.hotelContactNumber}</Typography>
                        <Typography><strong>Email:</strong> {formData.hotelEmail}</Typography>
                        <Typography><strong>Chain:</strong> {formData.hotelChain}</Typography>
                      </CardContent>
                    </Card>
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Special Remarks"
                      value={formData.specialRemarks}
                      onChange={(e) => setFormData({...formData, specialRemarks: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  <Button
                    color="inherit"
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                    startIcon={<ArrowBackIcon />}
                  >
                    Back
                  </Button>
                  <Box sx={{ flex: '1 1 auto' }} />
                  <Button 
                    onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                    variant="contained"
                    endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <ArrowForwardIcon />}
                    sx={{ backgroundColor: '#2c3e50' }}
                  >
                    {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </React.Fragment>
        )}
      </Box>
    </Paper>
  );
};

// Hotel Sales List Component
const HotelSalesList = ({ showNotification }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHotel, setEditingHotel] = useState(null);
  const [viewHotel, setViewHotel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('hotelName');
  const [selected, setSelected] = useState([]);

  // Sample data for demonstration
  useEffect(() => {
    const sampleHotels = [
      {
        id: 1,
        hotelName: "Grand Plaza Hotel",
        city: "New York",
        country: "United States",
        hotelChain: "Luxury Collection",
        salesPersons: [{ name: "John Smith", email: "john@example.com", contact: "+1 123-456-7890" }],
        reservationPersons: [{ name: "Emma Johnson", email: "emma@example.com", contact: "+1 123-456-7891" }],
        hotelContactNumber: "+1 123-456-7890",
        hotelEmail: "info@grandplaza.com",
        address: "123 Main Street, New York, NY"
      },
      {
        id: 2,
        hotelName: "Oceanview Resort",
        city: "Miami",
        country: "United States",
        hotelChain: "Beachfront Hotels",
        salesPersons: [{ name: "Michael Brown", email: "michael@example.com", contact: "+1 123-456-7892" }],
        reservationPersons: [{ name: "Sarah Wilson", email: "sarah@example.com", contact: "+1 123-456-7893" }],
        hotelContactNumber: "+1 123-456-7892",
        hotelEmail: "info@oceanview.com",
        address: "456 Beach Boulevard, Miami, FL"
      },
      {
        id: 3,
        hotelName: "Mountain Retreat",
        city: "Denver",
        country: "United States",
        hotelChain: "Nature Escapes",
        salesPersons: [{ name: "David Lee", email: "david@example.com", contact: "+1 123-456-7894" }],
        reservationPersons: [{ name: "Jennifer Davis", email: "jennifer@example.com", contact: "+1 123-456-7895" }],
        hotelContactNumber: "+1 123-456-7894",
        hotelEmail: "info@mountainretreat.com",
        address: "789 Mountain Road, Denver, CO"
      }
    ];
    
    setHotels(sampleHotels);
    setLoading(false);
  }, []);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = hotels.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry ? hotel.country === filterCountry : true;
    const matchesCity = filterCity ? hotel.city === filterCity : true;
    return matchesSearch && matchesCountry && matchesCity;
  });

  const countries = [...new Set(hotels.map(hotel => hotel.country).filter(Boolean))];
  const cities = [...new Set(hotels.map(hotel => hotel.city).filter(Boolean))];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ borderRadius: 2 }}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom color="#2c3e50">
          Hotel Management
        </Typography>
        <Typography variant="body1" color="#7f8c8d" gutterBottom>
          View and manage all hotels in the system
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mt={3}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search hotels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          
          <Box>
            <FormControl variant="outlined" size="small" sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel>Country</InputLabel>
              <Select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                label="Country"
              >
                <MenuItem value="">All Countries</MenuItem>
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>{country}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ mr: 1, minWidth: 120 }}>
              <InputLabel>City</InputLabel>
              <Select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                label="City"
              >
                <MenuItem value="">All Cities</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              onClick={() => { setFilterCountry(""); setFilterCity(""); setSearchTerm(""); }}
              startIcon={<FilterIcon />}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < hotels.length}
                    checked={hotels.length > 0 && selected.length === hotels.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'hotelName'}
                    direction={orderBy === 'hotelName' ? order : 'asc'}
                    onClick={() => handleRequestSort('hotelName')}
                  >
                    Hotel Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'city'}
                    direction={orderBy === 'city' ? order : 'asc'}
                    onClick={() => handleRequestSort('city')}
                  >
                    City
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'country'}
                    direction={orderBy === 'country' ? order : 'asc'}
                    onClick={() => handleRequestSort('country')}
                  >
                    Country
                  </TableSortLabel>
                </TableCell>
                <TableCell>Sales Contacts</TableCell>
                <TableCell>Reservation Contacts</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHotels
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((hotel) => {
                  const isItemSelected = isSelected(hotel.id);
                  return (
                    <TableRow
                      hover
                      onClick={() => handleClick(hotel.id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={hotel.id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ bgcolor: '#2c3e50', mr: 2 }}>
                            <HotelIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1">{hotel.hotelName || 'No Name Provided'}</Typography>
                            {hotel.hotelChain && (
                              <Typography variant="caption" color="textSecondary">
                                {hotel.hotelChain}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{hotel.city}</TableCell>
                      <TableCell>
                        <Chip label={hotel.country} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${hotel.salesPersons.length} contact${hotel.salesPersons.length !== 1 ? 's' : ''}`} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${hotel.reservationPersons?.length || 0} contact${hotel.reservationPersons?.length !== 1 ? 's' : ''}`} 
                          color="secondary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Tooltip title="View details">
                            <IconButton onClick={() => setViewHotel(hotel)} size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => setEditingHotel(hotel)} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredHotels.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
      
      {/* View Hotel Dialog */}
      <Dialog open={!!viewHotel} onClose={() => setViewHotel(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <HotelIcon sx={{ mr: 1 }} />
            Hotel Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewHotel && (
            <Box>
              <Typography variant="h6" gutterBottom>{viewHotel.hotelName}</Typography>
              {viewHotel.hotelChain && (
                <Chip label={viewHotel.hotelChain} sx={{ mb: 2 }} />
              )}
              
              <Box display="flex" alignItems="center" mb={2}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography>
                  {viewHotel.address}, {viewHotel.city}, {viewHotel.country}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {viewHotel.hotelContactNumber && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center">
                      <PhoneIcon color="action" sx={{ mr: 1 }} />
                      <Typography>{viewHotel.hotelContactNumber}</Typography>
                    </Box>
                  </Grid>
                )}
                {viewHotel.hotelEmail && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center">
                      <EmailIcon color="action" sx={{ mr: 1 }} />
                      <Typography>{viewHotel.hotelEmail}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>Contact Persons</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Sales Contacts</Typography>
                  {viewHotel.salesPersons.map((person, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="body2"><strong>{person.name}</strong></Typography>
                      <Typography variant="body2">{person.email}</Typography>
                      <Typography variant="body2">{person.contact}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Reservation Contacts</Typography>
                  {viewHotel.reservationPersons.map((person, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="body2"><strong>{person.name}</strong></Typography>
                      <Typography variant="body2">{person.email}</Typography>
                      <Typography variant="body2">{person.contact}</Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewHotel(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default HotelManagementSystem;