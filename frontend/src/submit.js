export const SubmitButton = () => {
  return (
    <div className="flex items-center justify-center border-t border-gray-200 bg-white px-4 py-5">
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        Submit
      </button>
    </div>
  );
};
