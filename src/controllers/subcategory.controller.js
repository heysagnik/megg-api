import * as subcategoryService from '../services/subcategory.service.js';

export const listAll = async (req, res, next) => {
    try {
        const result = await subcategoryService.listAllSubcategories();
        res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const listByCategory = async (req, res, next) => {
    try {
        const subcategories = await subcategoryService.getSubcategoriesByCategory(req.params.category);
        res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        res.json({ success: true, data: subcategories });
    } catch (error) {
        next(error);
    }
};

export const create = async (req, res, next) => {
    try {
        const result = await subcategoryService.createSubcategory(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const result = await subcategoryService.updateSubcategory(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        await subcategoryService.deleteSubcategory(req.params.id);
        res.json({ success: true, message: 'Subcategory deleted successfully' });
    } catch (error) {
        next(error);
    }
};
