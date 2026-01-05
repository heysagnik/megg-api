import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const listAllSubcategories = async () => {
    const results = await sql(`
    SELECT id, name, category, display_order, is_active, created_at
    FROM subcategories
    WHERE is_active = true
    ORDER BY category, display_order, name
  `);

    const grouped = {};
    for (const row of results) {
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push(row);
    }
    return { subcategories: results, grouped };
};

export const getSubcategoriesByCategory = async (category) => {
    const results = await sql(`
    SELECT id, name, category, display_order, is_active
    FROM subcategories
    WHERE category = $1 AND is_active = true
    ORDER BY display_order, name
  `, [category]);
    return results;
};

export const createSubcategory = async (data) => {
    const { name, category, display_order = 0 } = data;

    if (!name || !category) {
        throw new ValidationError('Name and category are required');
    }

    const [existing] = await sql(
        'SELECT id FROM subcategories WHERE name = $1 AND category = $2',
        [name, category]
    );
    if (existing) {
        throw new ValidationError(`Subcategory "${name}" already exists in ${category}`);
    }

    const [result] = await sql(`
    INSERT INTO subcategories (name, category, display_order)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [name, category, display_order]);

    return result;
};

export const updateSubcategory = async (id, updates) => {
    const [existing] = await sql('SELECT * FROM subcategories WHERE id = $1', [id]);
    if (!existing) throw new NotFoundError('Subcategory not found');

    const { name, category, display_order, is_active } = updates;
    const fields = [];
    const values = [id];
    let idx = 2;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (category !== undefined) { fields.push(`category = $${idx++}`); values.push(category); }
    if (display_order !== undefined) { fields.push(`display_order = $${idx++}`); values.push(display_order); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (fields.length === 0) return existing;

    const [result] = await sql(`
    UPDATE subcategories SET ${fields.join(', ')} WHERE id = $1 RETURNING *
  `, values);

    // If name changed, update products using old subcategory name
    if (name && name !== existing.name) {
        await sql(`
      UPDATE products SET subcategory = $1 
      WHERE subcategory = $2 AND category = $3
    `, [name, existing.name, existing.category]);
    }

    return result;
};

export const deleteSubcategory = async (id) => {
    const [existing] = await sql('SELECT * FROM subcategories WHERE id = $1', [id]);
    if (!existing) throw new NotFoundError('Subcategory not found');

    // Check if any products use this subcategory
    const [productCount] = await sql(`
    SELECT COUNT(*)::int as count FROM products 
    WHERE subcategory = $1 AND category = $2
  `, [existing.name, existing.category]);

    if (productCount.count > 0) {
        throw new ValidationError(`Cannot delete: ${productCount.count} products use this subcategory. Update them first or set is_active to false.`);
    }

    await sql('DELETE FROM subcategories WHERE id = $1', [id]);
    return true;
};

export const getValidSubcategories = async (category) => {
    const results = await sql(`
    SELECT name FROM subcategories 
    WHERE category = $1 AND is_active = true
  `, [category]);
    return results.map(r => r.name);
};
