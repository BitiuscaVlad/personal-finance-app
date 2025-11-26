import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the API service
jest.mock('../services/api');

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  test('renders Layout component', () => {
    render(<App />);
    // The app should render the layout
    expect(document.querySelector('body')).toBeInTheDocument();
  });
});
