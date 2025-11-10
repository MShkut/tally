// frontend/src/components/gifts/ContactImport.jsx
import React, { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  FormGrid,
  FormField,
  StandardInput,
  FormSection,
  StandardFormLayout,
  EmptyState,
  ListItem,
  ConfirmationModal
} from 'components/shared/FormComponents';

export const ContactImport = ({ onComplete, onBack, existingPeople = [] }) => {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState('upload'); // 'upload', 'review', 'holidays'
  const [importedContacts, setImportedContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFiles = async (files) => {
    if (!files?.[0]) return;
    const file = files[0];
    setFileName(file.name);
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      await parseCSVFile(file);
    } else if (file.name.toLowerCase().endsWith('.vcf')) {
      await parseVCFFile(file);
    } else {
      alert('Please upload a CSV or VCF file');
    }
  };

  const parseCSVFile = async (file) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const contacts = lines.slice(1).map((line, index) => {
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const contact = {
        id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`, // Unique ID
        selected: true
      };

      headers.forEach((header, i) => {
        const value = values[i]?.replace(/"/g, '').trim() || '';
        if (header.includes('name')) contact.name = value;
        else if (header.includes('birthday') || header.includes('birth')) contact.birthday = value;
        else if (header.includes('relationship')) contact.relationship = value;
        else if (header.includes('notes')) contact.notes = value;
      });

      return contact;
    }).filter(c => c.name); // Only keep contacts with names

    setImportedContacts(contacts);
    setSelectedContacts(contacts.map(c => c.id));
    setStep('review');
  };

  const parseVCFFile = async (file) => {
    const text = await file.text();

    // Better VCF splitting - split on BEGIN:VCARD and END:VCARD
    const vcardRegex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
    const vcards = text.match(vcardRegex) || [];

    console.log(`[ContactImport] Found ${vcards.length} vCards in file`);

    const skippedReasons = [];

    const contacts = vcards.map((vcard, index) => {
      const contact = {
        id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`, // Unique ID
        selected: true
      };

      // Extract name - try multiple formats
      // First try FN (Formatted Name) - look for full line
      let nameMatch = vcard.match(/^FN:(.*)$/im);
      if (nameMatch && nameMatch[1].trim()) {
        contact.name = nameMatch[1].trim();
      } else {
        // Try N (Structured Name: Last;First;Middle;Prefix;Suffix)
        const nMatch = vcard.match(/^N:(.*)$/im);
        if (nMatch && nMatch[1]) {
          const nameParts = nMatch[1].split(';').map(p => p.trim()).filter(p => p);
          // Rearrange: typically it's Last;First;Middle
          if (nameParts.length >= 2) {
            contact.name = `${nameParts[1]} ${nameParts[0]}`.trim(); // First Last
          } else if (nameParts.length === 1) {
            contact.name = nameParts[0];
          }
        }
      }

      // Track why this contact was skipped
      if (!contact.name || contact.name === '') {
        const preview = vcard.substring(0, 300).replace(/\n/g, ' ');
        skippedReasons.push(`Contact #${index + 1}: No name found. Preview: ${preview}...`);
        console.warn(`[ContactImport] Skipping contact #${index + 1} - no name found`);
        console.warn(`[ContactImport] Raw vCard:`, vcard);
      }

      // Extract birthday - handle different formats
      const bdayMatch = vcard.match(/^BDAY:(.*)$/im);
      if (bdayMatch && bdayMatch[1]) {
        let bday = bdayMatch[1].trim();
        // Convert YYYYMMDD format to YYYY-MM-DD
        if (bday.match(/^\d{8}$/)) {
          bday = `${bday.substr(0, 4)}-${bday.substr(4, 2)}-${bday.substr(6, 2)}`;
        }
        // Handle YYYY-MM-DD format
        if (bday.match(/^\d{4}-\d{2}-\d{2}$/)) {
          contact.birthday = bday;
        }
      }

      return contact;
    }).filter(c => c.name && c.name !== ''); // Only keep contacts with valid names

    // Show alert if contacts were skipped
    const skipped = vcards.length - contacts.length;
    if (skipped > 0) {
      console.error(`[ContactImport] Skipped ${skipped} contacts without names:`, skippedReasons);
      alert(`Warning: ${skipped} out of ${vcards.length} contacts were skipped because they had no name field.\n\nCheck the browser console (F12) for details about which contacts were skipped.`);
    }

    console.log(`[ContactImport] Successfully parsed ${contacts.length} contacts:`, contacts.map(c => c.name));

    setImportedContacts(contacts);
    setSelectedContacts(contacts.map(c => c.id));
    setStep('review');
  };

  const handleToggleContact = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleConfirmImport = () => {
    const contactsToImport = importedContacts.filter(c => 
      selectedContacts.includes(c.id)
    );
    
    // Check for duplicates
    const duplicates = contactsToImport.filter(contact => 
      existingPeople.some(person => 
        person.name.toLowerCase() === contact.name.toLowerCase()
      )
    );
    
    if (duplicates.length > 0) {
      setShowConfirm(true);
    } else {
      onComplete(contactsToImport);
    }
  };

  const handleProceedWithDuplicates = () => {
    const contactsToImport = importedContacts.filter(c => 
      selectedContacts.includes(c.id)
    );
    onComplete(contactsToImport);
  };

  const dragHandlers = {
    onDragEnter: (e) => { 
      e.preventDefault(); 
      setDragActive(true); 
    },
    onDragLeave: (e) => { 
      e.preventDefault(); 
      setDragActive(false); 
    },
    onDragOver: (e) => { 
      e.preventDefault(); 
    },
    onDrop: (e) => { 
      e.preventDefault(); 
      setDragActive(false); 
      handleFiles(e.dataTransfer.files); 
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = 'Name,Birthday,Relationship,Notes\n' +
      'John Doe,1990-03-15,Friend,Likes tech gadgets\n' +
      'Jane Smith,1985-07-22,Sister,Prefers gift cards';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gift-contacts-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (step === 'upload') {
    return (
      <>
        <ThemeToggle />
        <StandardFormLayout
          title="Import Contacts"
          subtitle="Import your contacts from a CSV or VCF file to quickly set up gift recipients"
          onBack={onBack}
          showBack={true}
          backLabel="Cancel"
        >
          
          {/* Upload Area */}
          <FormSection>
            <div 
              className={`
                py-24 border-2 text-center transition-all cursor-pointer
                ${dragActive 
                  ? isDarkMode 
                    ? 'border-white bg-gray-900' 
                    : 'border-black bg-gray-100'
                  : isDarkMode 
                    ? 'border-gray-700 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
              {...dragHandlers}
              onClick={() => document.getElementById('contact-file-input').click()}
            >
              <div className="text-6xl mb-8 opacity-50">📁</div>
              <h3 className={`text-3xl font-light mb-4 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Drop CSV or VCF file here
              </h3>
              <p className={`text-xl font-light mb-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                or click to browse
              </p>
              
              <input
                type="file"
                accept=".csv,.vcf"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="contact-file-input"
              />
            </div>
          </FormSection>

          {/* Template Download */}
          <FormSection>
            <div className="text-center">
              <button
                onClick={downloadTemplate}
                className={`
                  text-lg font-light border-b border-transparent hover:border-current pb-1
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
                  }
                `}
              >
                Download CSV Template
              </button>
            </div>
          </FormSection>

          {/* Privacy Note */}
          <FormSection>
            <div className={`text-center text-sm font-light ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              All contact data is processed locally on your device. No information is sent to external servers.
            </div>
          </FormSection>

        </StandardFormLayout>
      </>
    );
  }

  if (step === 'review') {
    const selectedCount = selectedContacts.length;
    
    return (
      <>
        <ThemeToggle />
        <StandardFormLayout
          title="Review Contacts"
          subtitle={`Found ${importedContacts.length} contacts in ${fileName}. Select which ones to import.`}
          onBack={() => setStep('upload')}
          onNext={handleConfirmImport}
          canGoNext={selectedCount > 0}
          nextLabel={`Import ${selectedCount} Contact${selectedCount !== 1 ? 's' : ''}`}
          backLabel="Choose Different File"
        >
          
          {/* Selection Controls */}
          <FormSection>
            <div className="flex gap-6">
              <button
                onClick={() => setSelectedContacts(importedContacts.map(c => c.id))}
                className={`
                  text-sm font-light border-b border-transparent hover:border-current pb-1
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
                  }
                `}
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedContacts([])}
                className={`
                  text-sm font-light border-b border-transparent hover:border-current pb-1
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
                  }
                `}
              >
                Select None
              </button>
            </div>
          </FormSection>

          {/* Contact List */}
          <FormSection>
            {importedContacts.length === 0 ? (
              <EmptyState
                title="No contacts found"
                description="The file doesn't contain any valid contacts"
              />
            ) : (
              <div className="space-y-0">
                {importedContacts.map(contact => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    selected={selectedContacts.includes(contact.id)}
                    onToggle={() => handleToggleContact(contact.id)}
                    isDuplicate={existingPeople.some(p => 
                      p.name.toLowerCase() === contact.name.toLowerCase()
                    )}
                  />
                ))}
              </div>
            )}
          </FormSection>

        </StandardFormLayout>

        {/* Duplicate Warning Modal */}
        <ConfirmationModal
          isOpen={showConfirm}
          title="Duplicate Contacts Found"
          description="Some contacts already exist in your gift list. Import anyway?"
          confirmText="Import All"
          cancelText="Cancel"
          onConfirm={handleProceedWithDuplicates}
          onCancel={() => setShowConfirm(false)}
        />
      </>
    );
  }

  return null;
};

// Contact item component
const ContactItem = ({ contact, selected, onToggle, isDuplicate }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <ListItem>
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-5 h-5"
        />
        <div className="flex-1">
          <div className={`text-base font-light ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {contact.name}
            {isDuplicate && (
              <span className="ml-2 text-sm text-yellow-500">(duplicate)</span>
            )}
          </div>
          <div className={`text-sm font-light mt-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {[
              contact.relationship,
              contact.birthday,
              contact.email,
              contact.phone
            ].filter(Boolean).join(' • ')}
          </div>
        </div>
      </div>
    </ListItem>
  );
};
