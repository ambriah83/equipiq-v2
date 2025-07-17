# Limble Data Analysis Summary

## Overview
This document analyzes the structure of Excel exports from Limble CMMS to design an effective import process for EquipIQ.

## File Analysis

### 1. Limble Assets.xlsx
**Total Records:** 2,180 assets  
**Total Columns:** 52 (many sparse/redundant)

#### Key Columns for Import:
- **Asset Name** - Equipment identifier
- **Limble Asset ID** - Unique ID in Limble
- **Parent Asset ID** - Hierarchical relationship (0 = top level)
- **Location Name** - Store location
- **Make** - Manufacturer
- **Model** - Equipment model
- **Category** - Equipment type (Sun/Spa/Spray)
- **Serial Number** - Equipment serial number
- **Machine Status** - Current status (Up/Down)
- **Warranty Expiration** - Warranty info
- **Notes** - General notes

#### Data Quality Issues:
- Many duplicate/similar columns (e.g., multiple warranty columns)
- HTML formatting in categories (e.g., `<font color="#efa131">Sun</font>`)
- Hierarchical structure using Parent Asset ID (rooms contain equipment)
- Very sparse data - most columns are >90% empty
- Mixed data in single columns

#### Location Structure:
- 44 unique locations total
- Format: "State Location Name (F)" for franchises
- Some marked as "Void" (closed locations?)
- Examples:
  - OK Edmond West/EHP
  - TX Alliance TX (F)
  - FL Tampa

### 2. Limble All Work Orders.xlsx
**Total Records:** 20,055 work orders  
**Total Columns:** 6

#### Columns:
- **Task Name** - Description of work (includes #ID suffix)
- **Due Date** - Scheduled date (format: MM/DD/YYYY H:MM:SS AM/PM)
- **Assigned To** - User/team assigned
- **Task ID** - Unique work order ID
- **Asset Name** - Related equipment (mostly empty)
- **ScheduleID** - For recurring tasks (mostly empty)

#### Key Users Found:
- Lanna Keene
- Admin
- Chris Dietz
- Ronald Regni
- Drian Semidey
- Texas Maintenance (team)
- Manager (role)
- Technician (role)

### 3. Limble Parts.xlsx
**Total Records:** 940 parts  
**Total Columns:** 28

#### Key Columns:
- **Part ID** - Unique identifier
- **Part Name** - Description
- **Part Number** - Manufacturer part number
- **Quantity** - Current stock
- **Price** - Unit price
- **Location** - Storage location
- **Min/Max Part Qty Threshold** - Inventory management
- **Manually Associated Assets** - Equipment using this part
- **Manually Associated Vendors** - Suppliers

#### Data Quality:
- Multiple vendor names in single fields (semicolon separated)
- Equipment associations as text lists
- Mixed naming conventions

### 4. Vendor Contacts.xlsx
**Total Records:** 197 contacts  
**Total Columns:** 30 (only first 8 have data)

#### Key Columns:
- **Equipment TYPE** - Category (Sat/Sun/SPRAY/SPA/ALL)
- **EQUIPMENT NAME** - Specific brand/model
- **Company Name** - Vendor company
- **VENDOR DEPARTMENT** - Service type
- **CONTACT NAME** - Person name
- **PHONE #** - Contact number
- **Website/Email** - Contact info
- **Notes** - Additional info

#### Vendor Categories:
- Equipment manufacturers (JK North America, KBL/UWE)
- Parts suppliers (Tanning Supplies Unlimited, California Tanning Supply)
- Service providers
- Location-specific vendors

## Import Strategy Recommendations

### 1. Location Import
- Parse location names to extract:
  - State (2-letter code)
  - City/Area name
  - Franchise indicator "(F)"
  - Active status (exclude "Void" locations)

### 2. Equipment Import
- Handle hierarchical structure (Rooms → Equipment)
- Clean HTML formatting from categories
- Map categories: Sun → sun_bed, Spa → spray_tan, etc.
- Extract clean serial numbers
- Parse warranty dates

### 3. User Import
- Extract unique users from work orders
- Identify roles vs. individuals
- Map to EquipIQ permission levels

### 4. Vendor Import
- Parse company names
- Clean contact information
- Map equipment types to categories
- Handle multiple contacts per vendor

### 5. Parts/Inventory
- Link parts to equipment
- Parse vendor associations
- Set up min/max thresholds

### 6. Work Order History
- Parse task descriptions
- Convert date formats
- Link to users and equipment where possible

## Data Cleaning Requirements

1. **Remove HTML tags** from category fields
2. **Standardize location names**
3. **Parse semicolon-separated lists** in vendor/asset associations
4. **Handle null/empty values** appropriately
5. **Normalize phone numbers** and email addresses
6. **Convert date formats** to consistent format
7. **Deduplicate** redundant columns
8. **Map string statuses** to boolean/enum values

## Mapping to EquipIQ Schema

### locations table
- name: Location Name (cleaned)
- address: Would need geocoding or manual entry
- type: Determine from name pattern
- status: active (exclude "Void" locations)

### equipment table
- name: Asset Name
- serial_number: Serial Number
- model: Model
- manufacturer: Make
- equipment_type: Map from Category
- location_id: Link via Location Name
- status: Map Machine Status

### users table
- email: Would need to generate/collect
- full_name: Parse from Assigned To
- role: Map from user patterns

### vendors table
- name: Company Name
- contact_name: CONTACT NAME
- email: Parse from Website/Email
- phone: PHONE #
- equipment_types: Map from Equipment TYPE

### maintenance_records table
- Create from work order history
- Link to equipment where possible
- Parse maintenance types from task names