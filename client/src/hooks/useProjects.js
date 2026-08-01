import { useState, useEffect, useCallback } from 'react';
import { getProjects, createProject, completeProject } from '../services/monitoringService.js';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const addNewProject = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const newProj = await createProject(formData);
      setProjects((prev) => [newProj, ...prev]);
      return newProj;
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeExistingProject = async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProj = await completeProject(id, formData);
      setProjects((prev) =>
        prev.map((p) => (p._id === id ? updatedProj : p))
      );
      return updatedProj;
    } catch (err) {
      console.error('Error completing project:', err);
      setError(err.message || 'Failed to complete project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetchProjects: fetchProjects,
    addNewProject,
    completeExistingProject
  };
};
