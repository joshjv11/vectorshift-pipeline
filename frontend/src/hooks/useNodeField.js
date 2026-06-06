import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store';

export const useNodeField = (nodeId, fieldName, initialValue) => {
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Subscribe to the live store value for this specific field.
  // When loadPipeline (or any external write) changes node.data, this selector
  // returns a new primitive and the sync effect below mirrors it into local state.
  const storeValue = useStore(
    useCallback(
      (state) => state.nodes.find((n) => n.id === nodeId)?.data?.[fieldName],
      [nodeId, fieldName]
    )
  );

  // Seed local state from the store when the field is already populated
  // (e.g. after a page reload from localStorage or after loadPipeline).
  const [value, setValue] = useState(() => storeValue ?? initialValue);

  // Mirror external store changes into local state.
  useEffect(() => {
    if (storeValue !== undefined) {
      setValue(storeValue);
    }
  }, [storeValue]);

  // On first mount (or nodeId / fieldName change), seed the store if the field
  // is absent — ensures downstream selectors always see a defined value.
  // initialValue is intentionally omitted from deps: re-seeding on every prop
  // change would overwrite user edits.
  useEffect(() => {
    if (storeValue === undefined) {
      updateNodeField(nodeId, fieldName, initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, fieldName]);

  const setFieldValue = useCallback(
    (nextValue) => {
      setValue(nextValue);
      updateNodeField(nodeId, fieldName, nextValue);
    },
    [nodeId, fieldName, updateNodeField]
  );

  return [value, setFieldValue];
};
