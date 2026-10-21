import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CitizenReportForm from '../components/citizen/CitizenReportForm.jsx';
import { mockApi } from './testUtils.jsx';

vi.mock('../components/citizen/GpsPicker.jsx', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange({ lat: '25.3', lng: '82.9' })}>set location</button>
  )
}));

afterEach(() => vi.restoreAllMocks());

const projects = [{ _id: 'p1', title: 'Village road', location: { address: 'Junction' } }];

const fillForm = async () => {
  await screen.findByRole('option', { name: /Village road/ });
  fireEvent.change(screen.getByLabelText(/project/i), { target: { value: 'p1' } });
  fireEvent.change(screen.getByLabelText(/description|describe/i), { target: { value: 'Pothole near the junction' } });
  fireEvent.click(screen.getByText('set location'));
  const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', { type: 'image/jpeg' });
  await act(async () => {
    fireEvent.change(screen.getByLabelText(/Photo of the problem/), { target: { files: [file] } });
  });
};

describe('CitizenReportForm', () => {
  test('does not ask citizens for a cm-per-pixel scale', async () => {
    mockApi({ 'GET /projects': { body: projects } });
    render(<CitizenReportForm />);
    await screen.findByRole('option', { name: /Village road/ });
    expect(screen.queryByText(/cm per pixel/i)).toBeNull();
    expect(screen.queryByLabelText(/scale/i)).toBeNull();
  });

  test('refuses an oversized photo before uploading anything', async () => {
    mockApi({ 'GET /projects': { body: projects } });
    render(<CitizenReportForm />);
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(/Photo of the problem/), { target: { files: [big] } });
    expect(await screen.findByText(/larger than 5 MB/)).toBeTruthy();
  });

  test('explains what is missing instead of submitting', async () => {
    const calls = mockApi({ 'GET /projects': { body: projects } });
    render(<CitizenReportForm />);
    await screen.findByRole('option', { name: /Village road/ });
    fireEvent.submit(screen.getByRole('button', { name: /Submit/ }).closest('form'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(calls.filter((call) => call.key === 'POST /citizen-reports')).toHaveLength(0);
  });

  test('a double click sends one report', async () => {
    let resolveSubmit;
    const calls = mockApi({
      'GET /projects': { body: projects },
      'POST /citizen-reports': () => new Promise((resolve) => { resolveSubmit = () => resolve({ status: 201, body: { _id: 'r1' } }); })
    });
    const onSuccess = vi.fn();
    render(<CitizenReportForm onSubmitSuccess={onSuccess} />);
    await fillForm();
    const form = screen.getByRole('button', { name: /Submit/ }).closest('form');
    await act(async () => { fireEvent.submit(form); });
    await act(async () => { fireEvent.submit(form); });
    expect(calls.filter((call) => call.key === 'POST /citizen-reports')).toHaveLength(1);
    await act(async () => resolveSubmit());
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ _id: 'r1' }));
  });

  test('if the project list fails, the citizen can still report another place', async () => {
    mockApi({ 'GET /projects': { status: 500, body: { message: 'down' } } });
    render(<CitizenReportForm />);
    expect(await screen.findByText(/project list could not be loaded/)).toBeTruthy();
    expect(screen.getByRole('option', { name: /Somewhere else/ })).toBeTruthy();
  });
});
