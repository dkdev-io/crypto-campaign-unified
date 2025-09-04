import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useDataUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, userProfile } = useAuth();

  const createUserTable = async (tableName, columns) => {
    try {
      const columnsArray = columns.map((col) => ({
        name: col,
        type: 'text',
      }));

      const { data, error } = await supabase.rpc('create_user_contribution_table', {
        p_table_name: tableName,
        p_columns: columnsArray,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating table:', error);
      return { success: false, error: error.message };
    }
  };

  const insertBatchData = async (tableName, dataArray) => {
    try {
      let insertedCount = 0;
      const batchSize = 50;

      for (let i = 0; i < dataArray.length; i += batchSize) {
        const batch = dataArray.slice(i, i + batchSize);
        setProgress(Math.round((i / dataArray.length) * 100));

        for (const rowData of batch) {
          const { data, error } = await supabase.rpc('insert_contribution_data', {
            p_table_name: tableName,
            p_data: rowData,
          });

          if (!error) {
            insertedCount++;
          } else {
            console.warn('Insert error:', error);
          }
        }

        // Small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setProgress(100);
      return { success: true, insertedCount };
    } catch (error) {
      console.error('Error inserting data:', error);
      return { success: false, error: error.message, insertedCount: 0 };
    }
  };

  const registerDataSource = async (
    tableName,
    sourceType,
    sourceName,
    recordCount,
    columnsInfo,
    metadata = {}
  ) => {
    try {
      const { data, error } = await supabase.rpc('register_data_source', {
        p_table_name: tableName,
        p_source_type: sourceType,
        p_source_name: sourceName,
        p_record_count: recordCount,
        p_columns_info: columnsInfo,
        p_metadata: metadata,
      });

      if (error) throw error;
      return { success: true, sourceId: data };
    } catch (error) {
      console.error('Error registering data source:', error);
      return { success: false, error: error.message };
    }
  };

  const getUserDataSources = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_data_summary');

      if (error) throw error;
      return { success: true, dataSources: data || [] };
    } catch (error) {
      console.error('Error fetching data sources:', error);
      return { success: false, error: error.message, dataSources: [] };
    }
  };

  const exportTableData = async (tableName) => {
    try {
      const { data, error } = await supabase.rpc('export_contribution_table_data', {
        p_table_name: tableName,
      });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteUserTable = async (tableName) => {
    try {
      const { data, error } = await supabase.rpc('delete_user_contribution_table', {
        p_table_name: tableName,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting table:', error);
      return { success: false, error: error.message };
    }
  };

  const generateTableName = (username) => {
    // Sanitize username for table name
    const sanitizedUsername =
      username
        ?.toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') || 'user';

    return `offlinecontributions_${sanitizedUsername}`;
  };

  const processCSVUpload = async (file, headers, dataRows) => {
    setUploading(true);
    setProgress(0);

    try {
      // Generate table name
      const tableName = generateTableName(userProfile?.email || user?.id);

      // Create table
      const tableResult = await createUserTable(tableName, headers);
      if (!tableResult.success) {
        throw new Error(`Failed to create table: ${tableResult.error}`);
      }

      // Prepare data for insertion
      const processedData = dataRows.map((row) => {
        const rowData = { source_file: file.name };

        headers.forEach((header, index) => {
          const sanitizedColumn = header.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
          rowData[sanitizedColumn] = row[index] || null;
        });

        return rowData;
      });

      // Insert data
      const insertResult = await insertBatchData(tableName, processedData);
      if (!insertResult.success) {
        throw new Error(`Failed to insert data: ${insertResult.error}`);
      }

      // Register data source
      const columnsInfo = headers.map((header) => ({
        name: header,
        sanitized: header.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_'),
      }));

      const registerResult = await registerDataSource(
        tableName,
        'csv_upload',
        file.name,
        insertResult.insertedCount,
        columnsInfo,
        {
          original_filename: file.name,
          file_size: file.size,
          columns_count: headers.length,
          upload_timestamp: new Date().toISOString(),
        }
      );

      if (!registerResult.success) {
        console.warn('Failed to register data source:', registerResult.error);
      }

      return {
        success: true,
        tableName,
        recordsInserted: insertResult.insertedCount,
        sourceId: registerResult.sourceId,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploading,
    progress,
    processCSVUpload,
    getUserDataSources,
    exportTableData,
    deleteUserTable,
    createUserTable,
    registerDataSource,
  };
};
