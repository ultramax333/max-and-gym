import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {ExercisePhotos} from './ExercisePhotos';

afterEach(() => vi.unstubAllGlobals());
it('displays and enlarges a local Blob, then revokes every object URL', async () => {
    const create = vi.fn().mockReturnValueOnce('blob:card').mockReturnValueOnce('blob:enlarged');
    const revoke = vi.fn();
    vi.stubGlobal('URL', {createObjectURL: create, revokeObjectURL: revoke});
    const media = [{kind: 'start-image' as const, path: '', altText: 'Personal curl', blob: new Blob(['test'], {type: 'image/png'})}];
    const {unmount} = render(<ExercisePhotos media={media}/>);
    expect(await screen.findByRole('img', {name: 'Personal curl'})).toHaveAttribute('src', 'blob:card');
    fireEvent.click(screen.getByRole('button', {name: 'Enlarge Personal curl'}));
    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(create).toHaveBeenCalledTimes(2);
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:card');
    expect(revoke).toHaveBeenCalledWith('blob:enlarged');
});

it('does not nest photo buttons inside library card links', () => {
    render(<ExercisePhotos interactive={false} media={[{kind: 'start-image', path: 'test.jpg', altText: 'Test'}]}/>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('test.jpg'));
});
