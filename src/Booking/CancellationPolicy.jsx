import React, { useState, useEffect } from "react";
import "./CancellationPolicy.css";

// Cancellation Policy Constants
export const CANCELLATION_POLICIES = {
  FLEXIBLE: {
    id: 'flexible',
    name: 'Flexible Policy',
    description: 'Free cancellation up to 24-48 hours before check-in; one night charged if cancelled later or no-show.',
    rules: [
      { type: 'free_cancellation_before', hours: 24, charge: 0 },
      { type: 'late_cancellation', charge: 'one_night' }
    ]
  },
  MODERATE: {
    id: 'moderate',
    name: 'Moderate Policy',
    description: 'Free cancellation up to 7 days before check-in; 50% charge if cancelled later.',
    rules: [
      { type: 'free_cancellation_before', days: 7, charge: 0 },
      { type: 'late_cancellation', charge: '50_percent' }
    ]
  },
  STRICT: {
    id: 'strict',
    name: 'Strict / Non-Refundable Policy',
    description: 'No refund after booking or after 24 hours of confirmation.',
    rules: [
      { type: 'non_refundable', hours: 24, charge: '100_percent' }
    ]
  },
  FREE_CANCELLATION: {
    id: 'free_cancellation',
    name: 'Free Cancellation',
    description: 'Free cancellation before specified days',
    rules: [
      { type: 'free_cancellation_before', days: null, charge: 0 }
    ]
  },
  GROUP: {
    id: 'group',
    name: 'Group / MICE Policy',
    description: '30+ days: No charge, 15-29 days: 50% charge, 0-14 days: 100% charge',
    rules: [
      { type: 'tiered', days: 30, charge: 0 },
      { type: 'tiered', days: 15, charge: '50_percent' },
      { type: 'tiered', days: 0, charge: '100_percent' }
    ]
  },
  NO_SHOW: {
    id: 'no_show',
    name: 'No-Show Policy',
    description: 'Charge 1 night or full stay if guest doesn\'t arrive and no prior cancellation.',
    rules: [
      { type: 'no_show', charge: 'one_night_or_full' }
    ]
  },
  SEASONAL: {
    id: 'seasonal',
    name: 'Seasonal / Tiered Policy',
    description: 'Varies by season',
    rules: []
  }
};

const CancellationPolicy = ({ policy, onChange }) => {
  const [selectedPolicy, setSelectedPolicy] = useState(policy.policyType);
  const [customPolicies, setCustomPolicies] = useState([]);
  const [showSaveCustom, setShowSaveCustom] = useState(false);

  // Load custom policies from localStorage on component mount
  useEffect(() => {
    const savedCustomPolicies = localStorage.getItem('customCancellationPolicies');
    if (savedCustomPolicies) {
      setCustomPolicies(JSON.parse(savedCustomPolicies));
    }
  }, []);

  // Save custom policies to localStorage whenever they change
  useEffect(() => {
    if (customPolicies.length > 0) {
      localStorage.setItem('customCancellationPolicies', JSON.stringify(customPolicies));
    }
  }, [customPolicies]);

  // Combine default and custom policies
  const getAllPolicies = () => {
    const customPolicyMap = {};
    customPolicies.forEach(customPolicy => {
      customPolicyMap[customPolicy.id] = customPolicy;
    });
    
    return { ...CANCELLATION_POLICIES, ...customPolicyMap };
  };

  const allPolicies = getAllPolicies();

  const handlePolicyTypeChange = (policyType) => {
    setSelectedPolicy(policyType);
    
    if (policyType === 'custom') {
      onChange({
        policyType: 'custom',
        customName: '',
        rules: [{ type: 'free_cancellation_before', days: 3, charge: 0, guestType: 'FIT' }]
      });
      setShowSaveCustom(false);
    } else {
      const template = allPolicies[policyType.toUpperCase()];
      if (template) {
        onChange({
          policyType,
          customName: '',
          rules: [...template.rules]
        });
        setShowSaveCustom(false);
      }
    }
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...policy.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onChange({ ...policy, rules: newRules });
    
    // Show save option when editing custom policy rules
    if (selectedPolicy === 'custom' && policy.customName) {
      setShowSaveCustom(true);
    }
  };

  const addRule = () => {
    const newRules = [
      ...policy.rules,
      { type: 'free_cancellation_before', days: 3, charge: 0, guestType: 'FIT' }
    ];
    onChange({ ...policy, rules: newRules });
    
    if (selectedPolicy === 'custom' && policy.customName) {
      setShowSaveCustom(true);
    }
  };

  const removeRule = (index) => {
    const newRules = policy.rules.filter((_, i) => i !== index);
    onChange({ ...policy, rules: newRules });
    
    if (selectedPolicy === 'custom' && policy.customName) {
      setShowSaveCustom(true);
    }
  };

  const saveCustomPolicy = () => {
    if (!policy.customName?.trim()) {
      alert('Please enter a name for your custom policy');
      return;
    }

    if (policy.rules.length === 0) {
      alert('Please add at least one rule to your custom policy');
      return;
    }

    const newCustomPolicy = {
      id: `custom_${Date.now()}`,
      name: policy.customName,
      description: generatePolicyDescription(policy),
      rules: [...policy.rules]
    };

    // Add to custom policies list
    const updatedCustomPolicies = [...customPolicies, newCustomPolicy];
    setCustomPolicies(updatedCustomPolicies);

    // Switch to using the saved custom policy
    setSelectedPolicy(newCustomPolicy.id);
    onChange({
      policyType: newCustomPolicy.id,
      customName: newCustomPolicy.name,
      rules: [...newCustomPolicy.rules]
    });

    setShowSaveCustom(false);
    alert('Custom policy saved successfully!');
  };

  const deleteCustomPolicy = (policyId) => {
    if (window.confirm('Are you sure you want to delete this custom policy?')) {
      const updatedCustomPolicies = customPolicies.filter(p => p.id !== policyId);
      setCustomPolicies(updatedCustomPolicies);
      
      // If currently selected policy is being deleted, switch to free cancellation
      if (selectedPolicy === policyId) {
        setSelectedPolicy('free_cancellation');
        handlePolicyTypeChange('free_cancellation');
      }
    }
  };

  // Helper function to generate policy description
  const generatePolicyDescription = (policy) => {
    if (policy.rules.length === 0) return 'Custom cancellation policy';
    
    return policy.rules.map(rule => generateRuleDescription(rule)).join('; ');
  };

  // Helper function to generate rule descriptions
  const generateRuleDescription = (rule) => {
    switch (rule.type) {
      case 'free_cancellation_before':
        return `Free cancellation ${rule.days} days before check-in`;
      case 'percentage_charge_before':
        return `${rule.charge?.replace('_percent', '%') || '0%'} charge if cancelled within ${rule.days} days`;
      case 'non_refundable':
        return `Non-refundable after ${rule.hours} hours of confirmation`;
      case 'tiered':
        return `${rule.days}+ days: ${rule.charge === 0 ? 'No charge' : (rule.charge?.replace('_percent', '%') || '0%') + ' charge'}`;
      case 'no_show':
        return `No-show: ${rule.charge === 'one_night_or_full' ? 'Charge one night or full stay' : 'Full charge'}`;
      default:
        return 'Custom rule';
    }
  };

  // Helper function to generate policy preview
  const generatePolicyPreview = (policy) => {
    const policyTemplate = allPolicies[policy.policyType.toUpperCase()];
    if (policyTemplate) {
      return policyTemplate.description;
    }
    
    if (policy.rules.length > 0) {
      return policy.rules.map((rule, index) => (
        <div key={index} className="preview-rule">
          • {generateRuleDescription(rule)}
          {rule.guestType && rule.guestType !== 'BOTH' && ` (${rule.guestType} only)`}
        </div>
      ));
    }
    
    return 'No policy defined';
  };

  // Check if current custom policy is already saved
  const isCustomPolicySaved = customPolicies.some(
    customPolicy => customPolicy.name === policy.customName
  );

  return (
    <div className="cancellation-policy-section">
      <h4>Cancellation Policy</h4>
      
      {/* Policy Type Selection */}
      <div className="policy-type-selection">
        <label>Policy Type *</label>
        <select
          value={selectedPolicy}
          onChange={(e) => handlePolicyTypeChange(e.target.value)}
          className="policy-type-select"
        >
          {/* Default Policies */}
          <optgroup label="Standard Policies">
            <option value="free_cancellation">Free Cancellation</option>
            <option value="flexible">Flexible Policy</option>
            <option value="moderate">Moderate Policy</option>
            <option value="strict">Strict / Non-Refundable</option>
            <option value="group">Group / MICE Policy</option>
            <option value="no_show">No-Show Policy</option>
            <option value="seasonal">Seasonal / Tiered Policy</option>
          </optgroup>
          
          {/* Custom Policies */}
          {customPolicies.length > 0 && (
            <optgroup label="Custom Policies">
              {customPolicies.map((customPolicy) => (
                <option key={customPolicy.id} value={customPolicy.id}>
                  {customPolicy.name}
                </option>
              ))}
            </optgroup>
          )}
          
          {/* Create New Custom */}
          <option value="custom">+ Create New Custom Policy</option>
        </select>
      </div>

      {/* Custom Policy Name - Show for new custom or when editing custom */}
      {(selectedPolicy === 'custom' || customPolicies.some(p => p.id === selectedPolicy)) && (
        <div className="policy-custom-name">
          <label>Policy Name</label>
          <div className="policy-name-input-wrapper">
            <input
              type="text"
              value={policy.customName || ''}
              onChange={(e) => {
                onChange({ ...policy, customName: e.target.value });
                if (selectedPolicy === 'custom') {
                  setShowSaveCustom(true);
                }
              }}
              placeholder="Enter policy name"
              className="policy-name-input"
              disabled={selectedPolicy !== 'custom'} // Only editable for new custom policies
            />
            {customPolicies.some(p => p.id === selectedPolicy) && (
              <button
                type="button"
                onClick={() => deleteCustomPolicy(selectedPolicy)}
                className="delete-policy-btn"
                title="Delete this custom policy"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      )}

      {/* Policy Description */}
      <div className="policy-description">
        <strong>Description:</strong>{' '}
        {allPolicies[selectedPolicy.toUpperCase()]?.description || generatePolicyDescription(policy)}
      </div>

      {/* Custom Rules Editor - Show for custom policies */}
      {(selectedPolicy === 'custom' || customPolicies.some(p => p.id === selectedPolicy)) && (
        <div className="custom-rules-section">
          <div className="rules-header">
            <h5>Cancellation Rules</h5>
            <div className="rules-header-actions">
              <button type="button" onClick={addRule} className="add-rule-btn">
                + Add Rule
              </button>
              {showSaveCustom && selectedPolicy === 'custom' && !isCustomPolicySaved && (
                <button 
                  type="button" 
                  onClick={saveCustomPolicy} 
                  className="save-custom-btn"
                >
                  💾 Save as Custom Policy
                </button>
              )}
            </div>
          </div>

          {policy.rules.map((rule, index) => (
            <div key={index} className="cancellation-rule">
              <div className="rule-row">
                {/* Rule Type */}
                <div className="rule-field">
                  <label>Rule Type</label>
                  <select
                    value={rule.type}
                    onChange={(e) => handleRuleChange(index, 'type', e.target.value)}
                    className="rule-type-select"
                  >
                    <option value="free_cancellation_before">Free Cancellation Before</option>
                    <option value="percentage_charge_before">Percentage Charge Before</option>
                    <option value="fixed_charge_before">Fixed Charge Before</option>
                    <option value="non_refundable">Non-Refundable After</option>
                    <option value="tiered">Tiered Charge</option>
                    <option value="no_show">No-Show</option>
                  </select>
                </div>

                {/* Days/Hours */}
                <div className="rule-field">
                  <label>
                    {rule.type.includes('before') ? 'Days Before' : 
                     rule.type === 'non_refundable' ? 'Hours After' : 'Days Before'}
                  </label>
                  <input
                    type="number"
                    value={rule.days || rule.hours || ''}
                    onChange={(e) => {
                      const field = rule.type === 'non_refundable' ? 'hours' : 'days';
                      handleRuleChange(index, field, parseInt(e.target.value) || 0);
                    }}
                    className="rule-days-input"
                    min="0"
                  />
                </div>

                {/* Guest Type */}
                <div className="rule-field">
                  <label>Guest Type</label>
                  <select
                    value={rule.guestType || 'BOTH'}
                    onChange={(e) => handleRuleChange(index, 'guestType', e.target.value)}
                    className="guest-type-select"
                  >
                    <option value="BOTH">Both FIT & Group</option>
                    <option value="FIT">FIT Only</option>
                    <option value="GROUP">Group Only</option>
                  </select>
                </div>

                {/* Charge Type */}
                <div className="rule-field">
                  <label>Charge</label>
                  <select
                    value={rule.charge}
                    onChange={(e) => handleRuleChange(index, 'charge', e.target.value)}
                    className="charge-select"
                  >
                    <option value={0}>Free (0%)</option>
                    <option value="25_percent">25%</option>
                    <option value="50_percent">50%</option>
                    <option value="75_percent">75%</option>
                    <option value="100_percent">100%</option>
                    <option value="one_night">One Night</option>
                    <option value="full_stay">Full Stay</option>
                    <option value="one_night_or_full">One Night or Full Stay</option>
                  </select>
                </div>

                {/* Remove Rule Button */}
                {policy.rules.length > 1 && (
                  <div className="rule-field">
                    <label>&nbsp;</label>
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="remove-rule-btn"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Rule Description */}
              <div className="rule-description">
                {generateRuleDescription(rule)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Policy Preview */}
      <div className="policy-preview">
        <h5>Policy Preview:</h5>
        <div className="preview-content">
          {generatePolicyPreview(policy)}
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;