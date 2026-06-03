import { useCallback, useState } from 'react';
import { useStore } from '../store';

export const useNodeField = (nodeId, fieldName, initialValue) => {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const [value, setValue] = useState(initialValue);

  const setFieldValue = useCallback(
    (nextValue) => {
      setValue(nextValue);
      updateNodeField(nodeId, fieldName, nextValue);
    },
    [nodeId, fieldName, updateNodeField]
  );

  return [value, setFieldValue];
};
